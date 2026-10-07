import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/**
 * Data access for the daily lifecycle job (B4). The job has no user JWT, so
 * every method uses the service-role client (hence the `AsServiceRole`
 * suffix) against the `0010_lifecycle.sql` RPCs. Raw postgrest envelopes;
 * the service parses them.
 */
@Injectable()
export class LifecycleRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Published invitations ending in 6–7 days that were never reminded (service role). */
  async dueRemindersAsServiceRole(now: Date): Promise<unknown> {
    return this.supabase.admin().rpc('lifecycle_due_reminders', {p_now: now.toISOString()});
  }

  /** Stamps `end_reminder_sent_at` (service role). No-op when already stamped. */
  async markRemindedAsServiceRole(invitationId: string, now: Date): Promise<unknown> {
    return this.supabase.admin().rpc('lifecycle_mark_reminded', {p_invitation_id: invitationId, p_now: now.toISOString()});
  }

  /** Flips published invitations past `online_until` to `ended` (service role). Returns the flip count. */
  async endExpiredAsServiceRole(now: Date): Promise<unknown> {
    return this.supabase.admin().rpc('lifecycle_end_expired', {p_now: now.toISOString()});
  }

  /** Purges guest phones + archives invitations ended 30+ days ago (service role). Returns `{purged, archived}`. */
  async purgeAndArchiveAsServiceRole(now: Date): Promise<unknown> {
    return this.supabase.admin().rpc('lifecycle_purge_and_archive', {p_now: now.toISOString()});
  }

  /** Refreshes cached points balances for users holding expired rows (service role). Returns the profile count. */
  async expirePointsAsServiceRole(now: Date): Promise<unknown> {
    return this.supabase.admin().rpc('lifecycle_expire_points', {p_now: now.toISOString()});
  }

  /** Pending manual orders older than 72 h -> `expired` (0009, service role). Returns the count. */
  async expireStaleManualOrdersAsServiceRole(): Promise<unknown> {
    return this.supabase.admin().rpc('expire_stale_manual_orders', {});
  }
}
