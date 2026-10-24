import {
  BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import {
  DocumentError, checkDocumentAgainstPlan, checkLockedSections, fromDbTier, invitationData, invitationDocument, migrate,
  slugCandidates, slugProblem, type InvitationDocument, type Tier
} from '@platform/shared';
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

/** Exactly one of: the legacy flat `data`, or the editor `document` (T10). */
export class UpdateInvitationBody extends createZodDto(
  z
    .object({data: invitationData.optional(), document: invitationDocument.optional()})
    .strict()
    .refine((body) => (body.data === undefined) !== (body.document === undefined), {message: 'Send exactly one of "data" or "document"'})
) {}

const slugField = z.string().min(1).max(120);
export class SwitchTemplateBody extends createZodDto(z.object({templateSlug: z.string().min(1).max(120)}).strict()) {}
export class UpdateSlugBody extends createZodDto(z.object({slug: slugField}).strict()) {}
export class SlugParams extends createZodDto(z.object({slug: slugField})) {}

export interface InvitationDetail {
  id: string;
  slug: string;
  status: string;
  templateId: string | null;
  templateSlug: string | null;
  orderId: string | null;
  data: unknown;
  /** The stored data upgraded to the editor document model (`null` when the stored shape is unrecognised). */
  document: InvitationDocument | null;
  /** 0 = stored as legacy data, 1 = stored as a document. */
  documentVersion: number;
  /** Plan the editor rules follow: the paid entitlement's tier, else the order's tier. */
  tier: string | null;
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

/** SQLSTATE + message of a postgres.js error (`PostgresError` exposes both); empty for anything else. */
function errorText(error: unknown): {code: string; message: string} {
  if (!isRecord(error)) return {code: '', message: ''};
  return {
    code: typeof error.code === 'string' ? error.code : '',
    message: typeof error.message === 'string' ? error.message : ''
  };
}

function safeMigrate(data: unknown): InvitationDocument | null {
  try {
    return migrate(data);
  } catch (error) {
    if (error instanceof DocumentError) return null;
    throw error;
  }
}

function tierOf(row: Record<string, unknown>): string | null {
  const entitlement = isRecord(row.entitlement) ? row.entitlement : null;
  if (entitlement !== null && typeof entitlement.tier === 'string') return entitlement.tier;
  return typeof row.order_tier === 'string' ? row.order_tier : null;
}

function planTier(detail: InvitationDetail): Tier {
  try {
    // An invitation with no paid entitlement or order yet gets the most restrictive plan.
    return detail.tier === null ? 'save-the-date' : fromDbTier(detail.tier);
  } catch {
    return 'save-the-date';
  }
}

function toDetail(value: unknown, now: Date): InvitationDetail {
  if (!isRecord(value)) throw unavailable();
  const {id, slug, status, template_id, updated_at, published_at, order_id} = value;
  const template = isRecord(value.template) ? value.template : Array.isArray(value.template) && isRecord(value.template[0]) ? value.template[0] : null;
  if (
    typeof id !== 'string' || typeof slug !== 'string' || typeof status !== 'string' ||
    !(typeof template_id === 'string' || template_id === null) || typeof updated_at !== 'string' ||
    !(typeof published_at === 'string' || published_at === null) ||
    !(typeof order_id === 'string' || order_id === null)
  ) throw unavailable();
  return {
    id, slug, status, templateId: template_id,
    templateSlug: template !== null && typeof template.slug === 'string' ? template.slug : null,
    orderId: order_id, data: value.data, updatedAt: updated_at, publishedAt: published_at,
    document: safeMigrate(value.data),
    documentVersion: value.document_version === 1 ? 1 : 0,
    tier: tierOf(value),
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
    const row = await this.repository.findById(user.id, id);
    return row === null ? null : toDetail(row, this.clock.now());
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
      const current = await this.find(user, id);
      if (current === null) throw new NotFoundException('Invitation not found');
      // Everything is judged as a document, whichever shape the client sent.
      const next = body.document ?? migrate(body.data);
      if (body.data !== undefined && current.documentVersion === 1) {
        throw new ConflictException({code: 'document_required', message: 'This invitation is stored as an editor document; send "document"'});
      }
      const plan = checkDocumentAgainstPlan(next, planTier(current));
      if (plan.length > 0) {
        const tooMany = plan.some((violation) => violation.code === 'too_many_sections');
        throw new ConflictException({
          code: tooMany ? 'too_many_sections' : 'section_not_allowed',
          message: tooMany ? 'The plan allows fewer sections' : 'A section type is not part of the plan',
          violations: plan
        });
      }
      if (current.document !== null) {
        const locked = checkLockedSections(current.document, next);
        if (locked.length > 0) {
          throw new ConflictException({code: 'section_locked', message: 'A section locked by the template was changed', violations: locked});
        }
      }
      const updatedAt = await this.repository.updateDataIfMatch(user.id, id, body.document ?? body.data, version, body.document === undefined ? 0 : 1);
      if (updatedAt !== null) {
        if (typeof updatedAt !== 'string') throw unavailable();
        return {updatedAt};
      }
      // 0 rows: someone saved since this client loaded it (the row exists: it was just read).
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
      let updated: boolean;
      try {
        updated = await this.repository.updateSlug(user.id, id, rawSlug);
      } catch (error) {
        const {code, message} = errorText(error);
        if (code === '23505') throw new ConflictException({code: 'slug_taken', message: 'This slug is already taken'});
        if (message.includes('slug cannot change after publishing')) {
          throw new ConflictException({code: 'slug_locked', message: 'The link cannot change after the first publish'});
        }
        if (code === '23514') throw new BadRequestException({code: 'slug_invalid', message: 'Invalid slug'});
        this.logger.error('invitation slug update failed (upstream error)');
        throw unavailable();
      }
      if (!updated) throw new NotFoundException('Invitation not found');
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
      const data = await this.repository.publish(user.id, id, current.data);
      if (data === null || typeof data.ok !== 'boolean') throw unavailable();
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
      const data = await this.repository.undoPublish(user.id, id);
      if (data === null || typeof data.ok !== 'boolean') throw unavailable();
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
      const data = await this.repository.switchTemplate(user.id, id, templateSlug);
      if (data === null || typeof data.ok !== 'boolean') throw unavailable();
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
    return new Set(await this.repository.slugsTakenAsServiceRole(slugs));
  }

  /** Lets HTTP exceptions through; turns anything else (network, malformed) into a 503. */
  private async guarded<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('invitation request failed (upstream error)');
      throw unavailable();
    }
  }
}
