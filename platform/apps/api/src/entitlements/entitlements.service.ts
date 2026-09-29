import {Inject, Injectable, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {canPublish, daysOnlineLeft, remainingEdits} from '@platform/shared';
import {z} from 'zod';
import {createZodDto} from 'nestjs-zod';
import {CLOCK, type Clock} from '../common/clock';
import type {RequestUser} from '../common/decorators';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {SupabaseService} from '../supabase/supabase.service';

/** `GET /v1/invitations/:id/entitlement` — `:id` is a UUID, validated by Zod. */
const invitationIdSchema = z.object({id: z.uuid('invitation id must be a UUID')});
export class InvitationIdParams extends createZodDto(invitationIdSchema) {}

export interface CanPublishResult {
  ok: boolean;
  reason?: 'no_edits_left' | 'expired';
}

export interface EntitlementResponse {
  editsAllowed: number;
  editsUsed: number;
  editsRemaining: number;
  /** ISO timestamp, or null when the entitlement has no online window. */
  onlineUntil: string | null;
  daysOnlineLeft: number;
  canPublish: CanPublishResult;
}

interface EntitlementRow {
  edits_allowed: number;
  edits_used: number;
  online_until: string | null;
}

function toRow(data: unknown): EntitlementRow {
  if (!isRecord(data)) throw new ServiceUnavailableException('Entitlement service unavailable');
  const {edits_allowed, edits_used, online_until} = data;
  if (
    typeof edits_allowed !== 'number' ||
    typeof edits_used !== 'number' ||
    !(typeof online_until === 'string' || online_until === null) ||
    (typeof online_until === 'string' && Number.isNaN(Date.parse(online_until)))
  ) {
    throw new ServiceUnavailableException('Entitlement service unavailable');
  }
  return {edits_allowed, edits_used, online_until};
}

/**
 * Reads the caller's `invitation_entitlements` row through the user-scoped
 * client (RLS decides access — an invisible invitation is a 404) and computes
 * the dashboard meters with the pure functions from `@platform/shared`.
 * No HTTP calls here beyond the injected Supabase client, so unit tests mock
 * `SupabaseService` and fix the time via the `Clock` provider.
 */
@Injectable()
export class EntitlementsService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly logger: AppLogger
  ) {}

  async getEntitlement(user: RequestUser, invitationId: string): Promise<EntitlementResponse> {
    const client = this.supabase.forUser(user.jwt);
    try {
      // The postgrest response is typed `any` without generated table types —
      // pin it to `unknown` first and narrow from there (never `any`).
      const result: unknown = await client
        .from('invitation_entitlements')
        .select('edits_allowed,edits_used,online_until')
        .eq('invitation_id', invitationId)
        .single();
      if (!isRecord(result)) {
        this.logger.error('invitation_entitlements lookup failed (malformed response)');
        throw new ServiceUnavailableException('Entitlement service unavailable');
      }
      const {data, error}: {data: unknown; error: unknown} = result as {data: unknown; error: unknown};
      if (error !== null) {
        if (isRecord(error) && error.code === 'PGRST116') throw new NotFoundException('Entitlement not found');
        this.logger.error('invitation_entitlements lookup failed (upstream error)');
        throw new ServiceUnavailableException('Entitlement service unavailable');
      }
      if (data === null) throw new NotFoundException('Entitlement not found');
      return this.toResponse(toRow(data), this.clock.now());
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ServiceUnavailableException) throw err;
      this.logger.error('invitation_entitlements lookup failed (unreachable)');
      throw new ServiceUnavailableException('Entitlement service unavailable');
    }
  }

  /** Pure computation step — covered directly by unit tests with a fixed `now`. */
  toResponse(row: EntitlementRow, now: Date): EntitlementResponse {
    try {
      const onlineUntil = row.online_until === null ? null : new Date(row.online_until);
      const editsRemaining = remainingEdits({editsAllowed: row.edits_allowed, editsUsed: row.edits_used});
      if (onlineUntil === null) {
        return {
          editsAllowed: row.edits_allowed,
          editsUsed: row.edits_used,
          editsRemaining,
          onlineUntil: null,
          daysOnlineLeft: 0,
          canPublish: {ok: false, reason: 'expired'}
        };
      }
      const verdict = canPublish({editsAllowed: row.edits_allowed, editsUsed: row.edits_used, onlineUntil, now});
      return {
        editsAllowed: row.edits_allowed,
        editsUsed: row.edits_used,
        editsRemaining,
        onlineUntil: onlineUntil.toISOString(),
        daysOnlineLeft: daysOnlineLeft({onlineUntil, now}),
        canPublish: verdict.ok ? {ok: true} : {ok: false, reason: verdict.reason}
      };
    } catch {
      // `remainingEdits`/`canPublish` throw `RangeError` on bad counts or dates.
      throw new ServiceUnavailableException('Entitlement service unavailable');
    }
  }
}
