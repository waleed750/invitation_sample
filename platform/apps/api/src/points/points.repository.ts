import {Injectable} from '@nestjs/common';
import {allJson, firstJson, type JsonRow} from '../common/db-rows';
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
}
