import {Injectable} from '@nestjs/common';
import {allJson, firstJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface CreditSettingsRow {
  min_topup_minor: number;
  max_topup_minor: number;
  bonus_percent: number;
  bonus_min_topup_minor: number;
}

export interface LedgerRow {
  id: string;
  kind: 'topup' | 'bonus' | 'purchase' | 'refund' | 'admin';
  amount_minor: number;
  order_id: string | null;
  topup_id: string | null;
  note: string | null;
  created_at: string;
}

export interface TopupRow {
  id: string;
  reference: string;
  amount_minor: number;
  extra_minor: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  paid_minor: number | null;
  created_at: string;
  expires_at: string;
}

export interface AwaitingOrderRow {
  id: string;
  tier: string;
  amount_minor: number;
  currency: string;
  created_at: string;
  template: {slug: string} | null;
}

export interface OrderStatusRow {
  id: string;
  status: string;
  amount_minor: number;
  currency: string;
  invitation_id: string | null;
  invitation_slug: string | null;
}

export interface PendingTopupRow extends TopupRow {
  profiles: {id: string; name: string | null; phone: string | null; email: string | null} | null;
}

/** Credit balance data. Reads run as the owner (RLS); every write is a SECURITY DEFINER function run as service_role. */
@Injectable()
export class BalanceRepository {
  constructor(private readonly db: DbService) {}

  async settings(userId: string): Promise<CreditSettingsRow> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<JsonRow<CreditSettingsRow>[]>`
        select to_jsonb(s) as r from (select min_topup_minor, max_topup_minor, bonus_percent, bonus_min_topup_minor from public.credit_settings) s`;
      const row = firstJson(rows);
      if (row === null) throw new Error('credit settings missing');
      return row;
    });
  }

  async balance(userId: string): Promise<number> {
    return this.db.asUser({id: userId}, async (tx) => {
      const rows = await tx<{balance: string | number}[]>`select credit_balance_minor as balance from public.profiles where id = ${userId}::uuid`;
      return rows.length > 0 ? Number(rows[0].balance) : 0;
    });
  }

  async ledger(userId: string, limit: number, before: string | null): Promise<LedgerRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<LedgerRow>[]>`
        select to_jsonb(x) as r from (
          select l.id, l.kind, l.amount_minor, l.order_id, l.topup_id, l.note, l.created_at
          from public.credit_ledger l
          where l.user_id = ${userId}::uuid and (${before}::text is null or l.created_at < ${before}::text::timestamptz)
          order by l.created_at desc, l.id desc limit ${limit}::integer
        ) x`));
  }

  async topups(userId: string): Promise<TopupRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<TopupRow>[]>`
        select to_jsonb(x) as r from (
          select t.id, t.reference, t.amount_minor, t.extra_minor, t.currency, t.status, t.paid_minor, t.created_at, t.expires_at
          from public.credit_topups t where t.user_id = ${userId}::uuid order by t.created_at desc limit 50
        ) x`));
  }

  async awaitingOrders(userId: string): Promise<AwaitingOrderRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<AwaitingOrderRow>[]>`
        select to_jsonb(x) as r from (
          select o.id, o.tier, o.amount_minor, o.currency, o.created_at,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = o.template_id) as template
          from public.orders o where o.user_id = ${userId}::uuid and o.status = 'awaiting_balance' order by o.created_at, o.id
        ) x`));
  }

  async orderStatus(userId: string, orderId: string): Promise<OrderStatusRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<OrderStatusRow>[]>`
        select to_jsonb(x) as r from (
          select o.id, o.status, o.amount_minor, o.currency,
            (select i.id from public.invitations i where i.order_id = o.id order by i.created_at limit 1) as invitation_id,
            (select i.slug from public.invitations i where i.order_id = o.id order by i.created_at limit 1) as invitation_slug
          from public.orders o where o.id = ${orderId}::uuid and o.user_id = ${userId}::uuid
        ) x`));
  }

  async createTopup(userId: string, amountMinor: number): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.create_topup(${userId}::uuid, ${amountMinor}::bigint) as result`));
  }

  async payOrder(userId: string, orderId: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.purchase_with_credit(${userId}::uuid, ${orderId}::uuid) as result`));
  }

  async cancelOrder(userId: string, orderId: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.cancel_awaiting_order(${userId}::uuid, ${orderId}::uuid) as result`));
  }

  /** Pending (and recently expired) top-ups with their customer, oldest first. */
  async pendingTopups(): Promise<PendingTopupRow[]> {
    return this.db.asService(async (tx) => {
      await tx`select public.expire_stale_topups()`;
      return allJson(await tx<JsonRow<PendingTopupRow>[]>`
        select to_jsonb(x) as r from (
          select t.id, t.reference, t.amount_minor, t.extra_minor, t.currency, t.status, t.paid_minor, t.created_at, t.expires_at,
            (select jsonb_build_object('id', p.id, 'name', p.name, 'phone', p.phone, 'email', p.email) from public.profiles p where p.id = t.user_id) as profiles
          from public.credit_topups t where t.status = 'pending' order by t.created_at
        ) x`);
    });
  }

  async topupUserId(topupId: string): Promise<string | null> {
    return this.db.asService(async (tx) => {
      const rows = await tx<{user_id: string}[]>`select user_id from public.credit_topups where id = ${topupId}::uuid`;
      return rows.length > 0 ? rows[0].user_id : null;
    });
  }

  async confirmTopup(input: {adminId: string; topupId: string; paidMinor: number; txnRef: string; note: string | null; acceptMismatch: boolean}): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.confirm_topup(${input.adminId}::uuid, ${input.topupId}::uuid, ${input.paidMinor}::bigint, ${input.txnRef}::text, ${input.note}::text, ${input.acceptMismatch}::boolean) as result`));
  }

  async rejectTopup(adminId: string, topupId: string, reason: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.reject_topup(${adminId}::uuid, ${topupId}::uuid, ${reason}::text) as result`));
  }

  async adjustCredit(adminId: string, userId: string, deltaMinor: number, note: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_adjust_credit(${adminId}::uuid, ${userId}::uuid, ${deltaMinor}::bigint, ${note}::text) as result`));
  }

  async refundToBalance(adminId: string, orderId: string, note: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.refund_to_balance(${adminId}::uuid, ${orderId}::uuid, ${note}::text) as result`));
  }
}
