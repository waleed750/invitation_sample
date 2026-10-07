import {
  BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import {invitationData, slugCandidates, slugProblem} from '@platform/shared';
import {randomInt} from 'node:crypto';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import {CLOCK, type Clock} from '../common/clock';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {RevalidationService} from '../revalidation/revalidation.service';
import {InvitationsRepository} from './invitations.repository';
import {toEntitlement, type InvitationEntitlement} from './invitations.service';

export const invitationIdSchema = z.object({id: z.uuid('invitation id must be a UUID')});
export class InvitationIdParams extends createZodDto(invitationIdSchema) {}

export class UpdateInvitationBody extends createZodDto(z.object({data: invitationData}).strict()) {}

const slugField = z.string().min(1).max(120);
export class SwitchTemplateBody extends createZodDto(z.object({templateSlug: z.string().min(1).max(120)}).strict()) {}
export class UpdateSlugBody extends createZodDto(z.object({slug: slugField}).strict()) {}
export class SlugParams extends createZodDto(z.object({slug: slugField})) {}

export interface InvitationDetail {
  id: string;
  slug: string;
  status: string;
  templateId: string | null;
  data: unknown;
  /** Raw Postgres `updated_at`; send it back unchanged as `If-Match`. */
  updatedAt: string;
  publishedAt: string | null;
  entitlement: InvitationEntitlement & {tier: string | null};
}

export type PublishInvitationResult =
  | {ok: true; invitation: InvitationDetail}
  | {ok: false; reason: 'no_edits_left' | 'expired' | 'not_found'};

export type UndoPublishResult =
  | {ok: true; invitation: InvitationDetail}
  | {ok: false; reason: 'nothing_to_undo' | 'expired' | 'not_found'};

export type SwitchTemplateResult =
  | {ok: true; invitation: InvitationDetail}
  | {ok: false; reason: 'no_switches_left' | 'tier_mismatch' | 'template_not_found' | 'not_found'};

export interface SlugAvailability {
  available: boolean;
  reason?: 'invalid' | 'reserved' | 'taken';
  suggestions: string[];
}

const SUGGESTION_COUNT = 3;
const unavailable = (): ServiceUnavailableException => new ServiceUnavailableException('Invitations service unavailable');

function envelope(result: unknown): {data: unknown; error: unknown} {
  if (!isRecord(result) || !('data' in result) || !('error' in result)) throw unavailable();
  return {data: result.data, error: result.error};
}

function errorText(error: unknown): {code: string; message: string} {
  if (!isRecord(error)) return {code: '', message: ''};
  return {
    code: typeof error.code === 'string' ? error.code : '',
    message: typeof error.message === 'string' ? error.message : ''
  };
}

function toDetail(value: unknown, now: Date): InvitationDetail {
  if (!isRecord(value)) throw unavailable();
  const {id, slug, status, template_id, updated_at, published_at} = value;
  if (
    typeof id !== 'string' || typeof slug !== 'string' || typeof status !== 'string' ||
    !(typeof template_id === 'string' || template_id === null) || typeof updated_at !== 'string' ||
    !(typeof published_at === 'string' || published_at === null)
  ) throw unavailable();
  return {
    id, slug, status, templateId: template_id, data: value.data, updatedAt: updated_at, publishedAt: published_at,
    entitlement: toEntitlement(value.entitlement, now)
  };
}

/** Owner-side editing: read, autosave (optimistic concurrency), slug, availability, publish. */
@Injectable()
export class InvitationEditingService {
  constructor(
    private readonly repository: InvitationsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly logger: AppLogger,
    private readonly revalidation: RevalidationService
  ) {}

  /** `null` when RLS hides the row (or it does not exist). */
  private async find(user: RequestUser, id: string): Promise<InvitationDetail | null> {
    const {data, error} = envelope(await this.repository.findById(user.jwt, id));
    if (error !== null) {
      this.logger.error('invitation lookup failed (upstream error)');
      throw unavailable();
    }
    return data === null ? null : toDetail(data, this.clock.now());
  }

  async get(user: RequestUser, id: string): Promise<InvitationDetail> {
    const found = await this.guarded(() => this.find(user, id));
    if (found === null) throw new NotFoundException('Invitation not found');
    return found;
  }

  async updateData(user: RequestUser, id: string, body: UpdateInvitationBody, ifMatch: string | undefined): Promise<{updatedAt: string}> {
    if (ifMatch === undefined || ifMatch.trim() === '') {
      throw new HttpException(
        {code: 'precondition_required', message: 'If-Match header (the invitation updatedAt) is required'},
        HttpStatus.PRECONDITION_REQUIRED
      );
    }
    const version = ifMatch.trim().replace(/^W\//, '').replace(/^"(.*)"$/, '$1');
    if (Number.isNaN(Date.parse(version))) throw new BadRequestException('If-Match must be an updatedAt timestamp');
    return this.guarded(async () => {
      const {data, error} = envelope(await this.repository.updateDataIfMatch(user.jwt, id, body.data, version));
      if (error !== null) {
        this.logger.error('invitation update failed (upstream error)');
        throw unavailable();
      }
      if (Array.isArray(data) && data.length > 0) {
        const row: unknown = data[0];
        if (isRecord(row) && typeof row.updated_at === 'string') return {updatedAt: row.updated_at};
        throw unavailable();
      }
      // 0 rows: hidden/missing (404) or someone saved since this client loaded it (409).
      if ((await this.find(user, id)) === null) throw new NotFoundException('Invitation not found');
      throw new ConflictException({code: 'edit_conflict', message: 'The invitation was changed elsewhere; reload and retry'});
    });
  }

  async updateSlug(user: RequestUser, id: string, rawSlug: string): Promise<{slug: string}> {
    const problem = slugProblem(rawSlug);
    if (problem === 'invalid') throw new BadRequestException({code: 'slug_invalid', message: 'Slug must be 3-60 lowercase letters, digits and single hyphens'});
    if (problem === 'reserved') throw new BadRequestException({code: 'slug_reserved', message: 'This slug is reserved'});
    return this.guarded(async () => {
      const current = await this.find(user, id);
      if (current === null) throw new NotFoundException('Invitation not found');
      if (current.publishedAt !== null || current.status !== 'draft') {
        throw new ConflictException({code: 'slug_locked', message: 'The link cannot change after the first publish'});
      }
      if (current.slug === rawSlug) return {slug: rawSlug};
      const {data, error} = envelope(await this.repository.updateSlug(user.jwt, id, rawSlug));
      if (error !== null) {
        const {code, message} = errorText(error);
        if (code === '23505') throw new ConflictException({code: 'slug_taken', message: 'This slug is already taken'});
        if (message.includes('slug cannot change after publishing')) {
          throw new ConflictException({code: 'slug_locked', message: 'The link cannot change after the first publish'});
        }
        if (code === '23514') throw new BadRequestException({code: 'slug_invalid', message: 'Invalid slug'});
        this.logger.error('invitation slug update failed (upstream error)');
        throw unavailable();
      }
      if (!Array.isArray(data) || data.length === 0) throw new NotFoundException('Invitation not found');
      return {slug: rawSlug};
    });
  }

  async availability(slug: string): Promise<SlugAvailability> {
    const problem = slugProblem(slug);
    if (problem === 'invalid') return {available: false, reason: 'invalid', suggestions: []};
    return this.guarded(async () => {
      const candidates = slugCandidates(slug, this.clock.now().getUTCFullYear(), () => randomInt(0, 1000));
      const taken = await this.taken([slug, ...candidates]);
      const suggestions = candidates.filter((candidate) => !taken.has(candidate)).slice(0, SUGGESTION_COUNT);
      if (problem === 'reserved') return {available: false, reason: 'reserved', suggestions};
      if (taken.has(slug)) return {available: false, reason: 'taken', suggestions};
      return {available: true, suggestions: []};
    });
  }

  async publish(user: RequestUser, id: string): Promise<PublishInvitationResult> {
    return this.guarded(async () => {
      const current = await this.find(user, id);
      if (current === null) return {ok: false, reason: 'not_found'};
      const {data, error} = envelope(await this.repository.publish(user.jwt, id, current.data));
      if (error !== null) {
        this.logger.error('publish_invitation failed (upstream error)');
        throw unavailable();
      }
      if (!isRecord(data) || typeof data.ok !== 'boolean') throw unavailable();
      if (!data.ok) {
        if (data.reason === 'not_owner') return {ok: false, reason: 'not_found'};
        if (data.reason === 'no_edits_left' || data.reason === 'expired') return {ok: false, reason: data.reason};
        throw unavailable();
      }
      const fresh = await this.find(user, id);
      if (fresh === null) throw unavailable();
      this.revalidation.revalidateInvitation(fresh.slug);
      return {ok: true, invitation: fresh};
    });
  }

  async undoPublish(user: RequestUser, id: string): Promise<UndoPublishResult> {
    return this.guarded(async () => {
      if ((await this.find(user, id)) === null) return {ok: false, reason: 'not_found'};
      const {data, error} = envelope(await this.repository.undoPublish(user.jwt, id));
      if (error !== null) {
        this.logger.error('undo_publish failed (upstream error)');
        throw unavailable();
      }
      if (!isRecord(data) || typeof data.ok !== 'boolean') throw unavailable();
      if (!data.ok) {
        if (data.reason === 'not_owner') return {ok: false, reason: 'not_found'};
        if (data.reason === 'nothing_to_undo' || data.reason === 'expired') return {ok: false, reason: data.reason};
        throw unavailable();
      }
      const fresh = await this.find(user, id);
      if (fresh === null) throw unavailable();
      this.revalidation.revalidateInvitation(fresh.slug);
      return {ok: true, invitation: fresh};
    });
  }

  async switchTemplate(user: RequestUser, id: string, templateSlug: string): Promise<SwitchTemplateResult> {
    return this.guarded(async () => {
      if ((await this.find(user, id)) === null) return {ok: false, reason: 'not_found'};
      const {data, error} = envelope(await this.repository.switchTemplate(user.jwt, id, templateSlug));
      if (error !== null) {
        this.logger.error('switch_template failed (upstream error)');
        throw unavailable();
      }
      if (!isRecord(data) || typeof data.ok !== 'boolean') throw unavailable();
      if (!data.ok) {
        if (data.reason === 'not_owner') return {ok: false, reason: 'not_found'};
        if (data.reason === 'no_switches_left' || data.reason === 'tier_mismatch' || data.reason === 'template_not_found') {
          return {ok: false, reason: data.reason};
        }
        throw unavailable();
      }
      const fresh = await this.find(user, id);
      if (fresh === null) throw unavailable();
      this.revalidation.revalidateInvitation(fresh.slug);
      return {ok: true, invitation: fresh};
    });
  }

  private async taken(slugs: string[]): Promise<Set<string>> {
    const {data, error} = envelope(await this.repository.slugsTakenAsServiceRole(slugs));
    if (error !== null || !Array.isArray(data)) {
      this.logger.error('slug lookup failed (upstream error)');
      throw unavailable();
    }
    const out = new Set<string>();
    for (const row of data) if (isRecord(row) && typeof row.slug === 'string') out.add(row.slug);
    return out;
  }

  /** Lets HTTP exceptions through; turns anything else (network, malformed) into a 503. */
  private async guarded<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('invitation request failed (unreachable)');
      throw unavailable();
    }
  }
}
