import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface AffiliateRow {
  id: string;
  name: string;
  phone: string | null;
  ref_code: string;
  commission_pct: number;
  customer_discount_pct: number;
  payout_method: string | null;
  payout_details: Record<string, unknown>;
  active: boolean;
  created_at: string;
}

export interface PayoutRow {
  id: string;
  amount_egp: number;
  method: string | null;
  reference: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string;
}

export interface AffiliateOrderRow {
  order_id: string;
  paid_at: string;
  amount_minor: number;
  attribution: string | null;
  commission_minor: number;
  payable: boolean;
  self_referral: boolean;
}

@Injectable()
export class AdminAffiliatesRepository {
  constructor(private readonly db: DbService) {}

  async list(): Promise<AffiliateRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<AffiliateRow>[]>`
        select to_jsonb(a) as r from (
          select id, name, phone, ref_code, commission_pct, customer_discount_pct, payout_method, payout_details, active, created_at
          from public.affiliates order by created_at desc limit 500
        ) a`));
  }

  async save(adminId: string, id: string | null, data: Record<string, unknown>): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_save_affiliate(${adminId}::uuid, ${id}::uuid, ${JSON.stringify(data)}::text::jsonb) as result`));
  }

  async stats(id: string, from: string | null, to: string | null): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.affiliate_stats(${id}::uuid, ${from}::date, ${to}::date) as result`));
  }

  async payouts(id: string): Promise<PayoutRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<PayoutRow>[]>`
        select to_jsonb(p) as r from (
          select id, amount_egp, method, reference, period_start, period_end, paid_at
          from public.affiliate_payouts where affiliate_id = ${id}::uuid order by paid_at desc limit 200
        ) p`));
  }

  async recordPayout(adminId: string, id: string, input: {amountEgp: number; method: string | null; reference: string | null; from: string | null; to: string | null}): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_record_payout(${adminId}::uuid, ${id}::uuid, ${input.amountEgp}::numeric, ${input.method}::text, ${input.reference}::text,
          ${input.from}::date, ${input.to}::date) as result`));
  }

  /** Paid orders credited to the affiliate in the range, with commission and whether the refund window has passed. */
  async orders(id: string, from: string | null, to: string | null): Promise<AffiliateOrderRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<AffiliateOrderRow>[]>`
        select to_jsonb(o) as r from (
          select ord.id as order_id, ord.paid_at, ord.amount_minor, ord.attribution,
                 round(ord.amount_minor * a.commission_pct / 100.0)::bigint as commission_minor,
                 (ord.paid_at <= now() - interval '7 days') as payable,
                 (a.phone is not null and pr.phone is not null and pr.phone = a.phone) as self_referral
          from public.orders ord
          join public.affiliates a on a.id = ord.affiliate_id
          left join public.profiles pr on pr.id = ord.user_id
          where ord.affiliate_id = ${id}::uuid and ord.status = 'paid'
            and ord.paid_at::date between coalesce(${from}::date, date '2000-01-01') and coalesce(${to}::date, date '2999-12-31')
          order by ord.paid_at desc limit 5000
        ) o`));
  }

  async countClick(ref: string, path: string): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`select public.count_affiliate_click(${ref}::text, ${path}::text)`;
    });
  }
}
