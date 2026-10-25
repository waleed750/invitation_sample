import {Injectable} from '@nestjs/common';
import {allJson, firstJson, rpcObject, rpcValue, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface PointsBalanceRow {
  points_balance: number;
  purchases_count: number;
}

export interface PointsLedgerRow {
  id: string;
  order_id: string | null;
  delta: number;
  reason: string;
  created_at: string;
  expires_at: string | null;
}

/** Data access for points (RLS applies: `asUser`). */
@Injectable()
export class PointsRepository {
  constructor(private readonly db: DbService) {}

  /** Caller's balance + purchase count, or `null` when no profile is visible. */
  async findBalance(userId: string): Promise<PointsBalanceRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<PointsBalanceRow>[]>`
        select to_jsonb(p) as r from (
          select points_balance, purchases_count from public.profiles where id = ${userId}::uuid
        ) p`));
  }

  /** Caller's 50 most recent ledger rows. */
  async listLedger(userId: string): Promise<PointsLedgerRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<PointsLedgerRow>[]>`
        select to_jsonb(l) as r from (
          select id, order_id, delta, reason, created_at, expires_at
          from public.points_ledger where user_id = ${userId}::uuid
          order by created_at desc limit 50
        ) l order by l.created_at desc`));
  }

  /** The caller's referral code (made on first use), how many friends they invited and how many were rewarded. */
  async referral(userId: string): Promise<{code: string | null; summary: RpcObject | null}> {
    return this.db.asService(async (tx) => {
      const code = rpcValue(await tx<RpcRow<unknown>[]>`select public.get_referral_code(${userId}::uuid) as result`);
      const summary = rpcObject(await tx<RpcRow<unknown>[]>`select public.referral_summary(${userId}::uuid) as result`);
      return {code: typeof code === 'string' ? code : null, summary};
    });
  }

  /** Points that will expire within `days` (what the balance really loses), and the first date. */
  async expiringSoon(userId: string, days: number): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.points_expiring_soon(${userId}::uuid, ${days}::integer) as result`));
  }

  async spendable(userId: string): Promise<number> {
    return this.db.asService(async (tx) => {
      const value = rpcValue(await tx<RpcRow<unknown>[]>`select public.spendable_points(${userId}::uuid) as result`);
      return typeof value === 'number' ? value : 0;
    });
  }
}
