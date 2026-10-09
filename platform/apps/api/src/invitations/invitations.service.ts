import {Inject, Injectable, ServiceUnavailableException} from '@nestjs/common';
import {canPublish, daysOnlineLeft, fromDbTier, remainingEdits} from '@platform/shared';
import {AppLogger} from '../common/app-logger';
import {CLOCK, type Clock} from '../common/clock';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {InvitationsRepository} from './invitations.repository';

export interface InvitationSummary {
  id: string;
  orderId: string | null;
  templateSlug: string | null;
  tier: string | null;
  shareSlug: string;
  data: unknown;
  locale: string;
  status: string;
  createdAt: string;
  entitlement: {
    editsAllowed: number;
    editsUsed: number;
    remaining: number;
    onlineUntil: string | null;
    daysOnlineLeft: number;
    canPublish: {ok: true} | {ok: false; reason: 'no_edits_left' | 'expired'};
  };
}

function relation(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && isRecord(value[0])) return value[0];
  return null;
}

export type InvitationEntitlement = InvitationSummary['entitlement'];

/** Validates a raw entitlement relation (or its absence) and computes the dashboard meters. */
export function toEntitlement(raw: unknown, now: Date): InvitationEntitlement & {tier: string | null} {
  const entitlement = relation(raw);
  const editsAllowed = entitlement === null ? 0 : entitlement.edits_allowed;
  const editsUsed = entitlement === null ? 0 : entitlement.edits_used;
  const onlineUntilRaw = entitlement === null ? null : entitlement.online_until;
  const tierRaw = entitlement === null ? null : entitlement.tier;
  if (
    typeof editsAllowed !== 'number' || typeof editsUsed !== 'number' ||
    !(typeof onlineUntilRaw === 'string' || onlineUntilRaw === null) ||
    !(typeof tierRaw === 'string' || tierRaw === null)
  ) throw new ServiceUnavailableException('Invitations service unavailable');
  const remaining = remainingEdits({editsAllowed, editsUsed});
  const onlineUntil = onlineUntilRaw === null ? null : new Date(onlineUntilRaw);
  const verdict = onlineUntil === null
    ? {ok: false as const, reason: 'expired' as const}
    : canPublish({editsAllowed, editsUsed, onlineUntil, now});
  return {
    tier: tierRaw === null ? null : fromDbTier(tierRaw),
    editsAllowed,
    editsUsed,
    remaining,
    onlineUntil: onlineUntil?.toISOString() ?? null,
    daysOnlineLeft: onlineUntil === null ? 0 : daysOnlineLeft({onlineUntil, now}),
    canPublish: verdict
  };
}

function toSummary(value: unknown, now: Date): InvitationSummary {
  if (!isRecord(value)) throw new ServiceUnavailableException('Invitations service unavailable');
  const template = relation(value.template);
  if (
    typeof value.id !== 'string' || !(typeof value.order_id === 'string' || value.order_id === null) ||
    typeof value.slug !== 'string' || typeof value.locale !== 'string' || typeof value.status !== 'string' ||
    typeof value.created_at !== 'string'
  ) throw new ServiceUnavailableException('Invitations service unavailable');
  const {tier, ...entitlement} = toEntitlement(value.entitlement, now);
  return {
    id: value.id,
    orderId: value.order_id,
    templateSlug: template !== null && typeof template.slug === 'string' ? template.slug : null,
    tier,
    shareSlug: value.slug,
    data: value.data,
    locale: value.locale,
    status: value.status,
    createdAt: value.created_at,
    entitlement
  };
}

export {relation};

@Injectable()
export class InvitationsService {
  constructor(
    private readonly repository: InvitationsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly logger: AppLogger
  ) {}

  async list(user: RequestUser): Promise<InvitationSummary[]> {
    try {
      const rows = await this.repository.listByOwner(user.id);
      const now = this.clock.now();
      return rows.map((row) => toSummary(row, now));
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('invitations lookup failed');
      throw new ServiceUnavailableException('Invitations service unavailable');
    }
  }
}
