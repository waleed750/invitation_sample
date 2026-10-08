import {
  BadRequestException, ForbiddenException, GoneException, Inject, Injectable,
  NotFoundException, ServiceUnavailableException
} from '@nestjs/common';
import {TIERS, fromDbTier, normalizeEgyptPhone, type Tier} from '@platform/shared';
import {createHmac} from 'node:crypto';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import {CLOCK, type Clock} from '../common/clock';
import {isRecord} from '../common/type-guards';
import {AppConfigService} from '../config/app-config.service';
import {PublicInvitationsRepository} from './public-invitations.repository';

const slugSchema = z.object({slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)});
export class PublicSlugParams extends createZodDto(slugSchema) {}

const honeypot = z.string().max(200).optional();

const rsvpBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().max(40).optional(),
  attending: z.boolean(),
  guests: z.number().int().min(0).max(10),
  note: z.string().trim().max(500).optional(),
  website: honeypot
}).strict();
export class RsvpBody extends createZodDto(rsvpBodySchema) {}

const messageBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  text: z.string().trim().min(1).max(500),
  website: honeypot
}).strict();
export class GuestMessageBody extends createZodDto(messageBodySchema) {}

export interface EndedInvitation {
  state: 'ended';
  couple: {first: string; second: string};
  eventDate: string;
}

export interface LiveInvitation {
  state: 'live';
  slug: string;
  tier: string;
  locale: string;
  templateSlug: string | null;
  snapshot: unknown;
  publishedAt: string;
  onlineUntil: string | null;
}

export type PublicInvitation = EndedInvitation | LiveInvitation;

export interface GuestAck {
  ok: true;
}

interface ResolvedInvitation {
  id: string;
  tier: Tier;
  onlineUntil: Date | null;
  snapshot: unknown;
  publishedAt: string;
  locale: string;
  templateSlug: string | null;
}

function relation(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && isRecord(value[0])) return value[0];
  return null;
}

function stringField(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  return typeof value === 'string' ? value : null;
}

function stringOrNestedText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (isRecord(value)) {
    for (const key of ['ar', 'en', 'first', 'second']) {
      const nested = value[key];
      if (typeof nested === 'string' && nested !== '') return nested;
    }
  }
  return '';
}

/** Pulls display fields out of a publish snapshot of unknown shape (never throws). */
function extractEndedInfo(snapshot: unknown): {couple: {first: string; second: string}; eventDate: string} {
  const fallback = {couple: {first: '', second: ''}, eventDate: ''};
  if (!isRecord(snapshot)) return fallback;
  const data = isRecord(snapshot.data) ? snapshot.data : snapshot;
  const coupleRaw = isRecord(data.couple) ? data.couple : null;
  const eventRaw = isRecord(data.event) ? data.event : null;
  const first = coupleRaw === null
    ? stringOrNestedText(data.firstName)
    : stringOrNestedText(coupleRaw.first ?? coupleRaw.firstName);
  const second = coupleRaw === null
    ? stringOrNestedText(data.secondName)
    : stringOrNestedText(coupleRaw.second ?? coupleRaw.secondName);
  const eventDate = stringOrNestedText(data.eventDate ?? data.event_date)
    || (eventRaw === null ? '' : stringOrNestedText(eventRaw.date ?? eventRaw.displayDate));
  return {couple: {first, second}, eventDate};
}

/**
 * Anonymous guest flows. Reads the latest publish snapshot (or the ended
 * shell) and writes RSVPs / messages through the service-role repository —
 * RLS has no anon write policies by design. Phones and IP hashes never leave
 * through the public controller.
 */
@Injectable()
export class PublicInvitationsService {
  constructor(
    private readonly repository: PublicInvitationsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger
  ) {}

  async getBySlug(slug: string): Promise<PublicInvitation> {
    const resolved = await this.resolve(slug);
    const now = this.clock.now();
    if (resolved.onlineUntil !== null && now.getTime() >= resolved.onlineUntil.getTime()) {
      return {state: 'ended', ...extractEndedInfo(resolved.snapshot)};
    }
    return {
      state: 'live', slug, tier: resolved.tier, locale: resolved.locale, templateSlug: resolved.templateSlug,
      snapshot: resolved.snapshot, publishedAt: resolved.publishedAt,
      onlineUntil: resolved.onlineUntil?.toISOString() ?? null
    };
  }

  async submitRsvp(slug: string, body: RsvpBody, ip: string): Promise<GuestAck> {
    if (typeof body.website === 'string' && body.website.trim() !== '') return {ok: true};
    const resolved = await this.resolve(slug);
    this.rejectWhenEnded(resolved);
    const phone = this.normalizePhone(body.phone);
    const limit = this.rsvpLimit(resolved.tier);
    if (limit === 0) throw new ForbiddenException({code: 'rsvp_disabled', message: 'RSVPs are disabled for this invitation'});
    if (body.attending && limit !== null) {
      const attendingGuests = await this.attendingGuestCount(resolved.id);
      if (attendingGuests + body.guests > limit) {
        throw new ForbiddenException({code: 'rsvp_limit_reached', message: 'This invitation has reached its RSVP limit'});
      }
    }
    try {
      const result: unknown = await this.repository.saveRsvpAsServiceRole({
        invitation_id: resolved.id, name: body.name, phone, attending: body.attending,
        guests_count: body.guests, note: body.note ?? null, ip_hash: this.hashIp(ip)
      });
      if (!isRecord(result) || result.error !== null) {
        this.logger.error('public rsvp save failed (upstream error)');
        throw new ServiceUnavailableException('RSVP service unavailable');
      }
      return {ok: true};
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('public rsvp save failed (unreachable)');
      throw new ServiceUnavailableException('RSVP service unavailable');
    }
  }

  async submitMessage(slug: string, body: GuestMessageBody): Promise<GuestAck> {
    if (typeof body.website === 'string' && body.website.trim() !== '') return {ok: true};
    const resolved = await this.resolve(slug);
    this.rejectWhenEnded(resolved);
    if (!TIERS[resolved.tier].guestMessages) {
      throw new ForbiddenException({code: 'messages_disabled', message: 'Messages are disabled for this invitation'});
    }
    try {
      const result: unknown = await this.repository.saveMessageAsServiceRole({
        invitation_id: resolved.id, name: body.name, body: body.text
      });
      if (!isRecord(result) || result.error !== null) {
        this.logger.error('public message save failed (upstream error)');
        throw new ServiceUnavailableException('Guestbook service unavailable');
      }
      return {ok: true};
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('public message save failed (unreachable)');
      throw new ServiceUnavailableException('Guestbook service unavailable');
    }
  }

  /** Public invitation + entitlement + latest snapshot; 404 when invisible. */
  private async resolve(slug: string): Promise<ResolvedInvitation> {
    let invitation: unknown;
    try {
      invitation = await this.repository.findPublishedBySlugAsServiceRole(slug);
    } catch {
      this.logger.error('public invitation lookup failed (unreachable)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    if (!isRecord(invitation) || invitation.error !== null || !isRecord(invitation.data)) {
      if (isRecord(invitation) && isRecord(invitation.error) && invitation.error.code === 'PGRST116') {
        throw new NotFoundException({code: 'invitation_not_found', message: 'Invitation not found'});
      }
      this.logger.error('public invitation lookup failed (upstream error)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    const row = invitation.data;
    const id = stringField(row, 'id');
    const locale = stringField(row, 'locale');
    if (id === null || locale === null) {
      this.logger.error('public invitation lookup failed (malformed row)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    const entitlement = relation(row.entitlement);
    const tierRaw = entitlement === null ? null : entitlement.tier;
    const onlineUntilRaw = entitlement === null ? null : entitlement.online_until;
    if (
      typeof tierRaw !== 'string' ||
      !(typeof onlineUntilRaw === 'string' || onlineUntilRaw === null) ||
      (typeof onlineUntilRaw === 'string' && Number.isNaN(Date.parse(onlineUntilRaw)))
    ) {
      this.logger.error('public invitation lookup failed (malformed entitlement)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    let tier: Tier;
    try {
      tier = fromDbTier(tierRaw);
    } catch {
      this.logger.error('public invitation lookup failed (unknown tier)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    let publish: unknown;
    try {
      publish = await this.repository.findLatestPublishAsServiceRole(id);
    } catch {
      this.logger.error('public publish lookup failed (unreachable)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    if (!isRecord(publish) || publish.error !== null || !isRecord(publish.data)) {
      this.logger.error('public publish lookup failed (upstream error)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    const publishedAt = stringField(publish.data, 'published_at');
    if (publishedAt === null || !('snapshot' in publish.data)) {
      this.logger.error('public publish lookup failed (malformed row)');
      throw new ServiceUnavailableException('Invitation service unavailable');
    }
    const template = relation(row.template);
    return {
      id, tier, locale,
      templateSlug: template === null ? null : stringField(template, 'slug'),
      onlineUntil: onlineUntilRaw === null ? null : new Date(onlineUntilRaw),
      snapshot: publish.data.snapshot, publishedAt
    };
  }

  private rejectWhenEnded(resolved: ResolvedInvitation): void {
    if (resolved.onlineUntil !== null && this.clock.now().getTime() >= resolved.onlineUntil.getTime()) {
      throw new GoneException({code: 'invitation_ended', message: 'This invitation is no longer accepting responses'});
    }
  }

  private normalizePhone(raw: string | undefined): string | null {
    const trimmed = (raw ?? '').trim();
    if (trimmed === '') return null;
    const normalized = normalizeEgyptPhone(trimmed);
    if (normalized === null) {
      throw new BadRequestException({code: 'invalid_phone', message: 'Phone number is not a valid Egyptian mobile'});
    }
    return normalized;
  }

  private rsvpLimit(tier: Tier): number | null {
    return TIERS[tier].rsvpLimit;
  }

  private async attendingGuestCount(invitationId: string): Promise<number> {
    let result: unknown;
    try {
      result = await this.repository.listRsvpCountsAsServiceRole(invitationId);
    } catch {
      this.logger.error('public rsvp count failed (unreachable)');
      throw new ServiceUnavailableException('RSVP service unavailable');
    }
    if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) {
      this.logger.error('public rsvp count failed (upstream error)');
      throw new ServiceUnavailableException('RSVP service unavailable');
    }
    return result.data.reduce((sum: number, row: unknown) => {
      if (!isRecord(row) || typeof row.attending !== 'boolean' || typeof row.guests_count !== 'number') return sum;
      return row.attending ? sum + row.guests_count : sum;
    }, 0);
  }

  /** HMAC-SHA256 of the caller IP. Raw IPs are never stored. */
  hashIp(ip: string): string {
    return createHmac('sha256', this.config.ipHashSecret).update(ip).digest('hex');
  }
}
