import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcRow} from '../common/db-rows';
import {DbService, type Tx} from '../database';

/** One row of `lifecycle_due_reminders` (snake_case from Postgres, parsed by the service). */
export interface DueReminderDbRow {
  invitation_id: string;
  owner_id: string;
  online_until: string;
}

/**
 * Data access for the daily lifecycle job (B4). The job has no user, so every
 * method runs as the service role (hence the `AsServiceRole` suffix) against
 * the `0010_lifecycle.sql` RPCs. Postgres errors propagate; the service
 * counts them per step.
 */
@Injectable()
export class LifecycleRepository {
  constructor(private readonly db: DbService) {}

  /** Published invitations ending in 6–7 days that were never reminded (service role). */
  async dueRemindersAsServiceRole(now: Date): Promise<DueReminderDbRow[]> {
    const iso = now.toISOString();
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<DueReminderDbRow>[]>`
        select to_jsonb(d) as r from public.lifecycle_due_reminders(${iso}::timestamptz) d`));
  }

  /** Stamps `end_reminder_sent_at` (service role). No-op when already stamped. */
  async markRemindedAsServiceRole(invitationId: string, now: Date): Promise<void> {
    const iso = now.toISOString();
    await this.db.asService(async (tx) => {
      await tx`select public.lifecycle_mark_reminded(${invitationId}::uuid, ${iso}::timestamptz)`;
    });
  }

  /** Flips published invitations past `online_until` to `ended` (service role). Returns the flip count. */
  async endExpiredAsServiceRole(now: Date): Promise<number> {
    const iso = now.toISOString();
    return this.count(async (tx) => tx<RpcRow<unknown>[]>`
      select public.lifecycle_end_expired(${iso}::timestamptz) as result`);
  }

  /** Purges guest phones + archives invitations ended 30+ days ago (service role). Returns `{purged, archived}`. */
  async purgeAndArchiveAsServiceRole(now: Date): Promise<{purged: number; archived: number}> {
    const iso = now.toISOString();
    const result = await this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.lifecycle_purge_and_archive(${iso}::timestamptz) as result`));
    return {purged: toCount(result?.purged), archived: toCount(result?.archived)};
  }

  /** Refreshes cached points balances for users holding expired rows (service role). Returns the profile count. */
  async expirePointsAsServiceRole(now: Date): Promise<number> {
    const iso = now.toISOString();
    return this.count(async (tx) => tx<RpcRow<unknown>[]>`
      select public.lifecycle_expire_points(${iso}::timestamptz) as result`);
  }

  /** Pending manual orders older than 72 h -> `expired` (0009, service role). Returns the count. */
  async expireStaleManualOrdersAsServiceRole(): Promise<number> {
    return this.count(async (tx) => tx<RpcRow<unknown>[]>`
      select public.expire_stale_manual_orders() as result`);
  }

  private async count(query: (tx: Tx) => PromiseLike<RpcRow<unknown>[]>): Promise<number> {
    const rows = await this.db.asService(async (tx) => query(tx));
    return toCount(rows[0]?.result);
  }
}

/** Integer RPC results arrive as numbers (int4); tolerate numeric strings (int8). Anything else is a bad count. */
function toCount(value: unknown): number {
  const count = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('lifecycle RPC returned a bad count');
  return count;
}
