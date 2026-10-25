import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface CouponRow {
  code: string;
  percent_off: number | null;
  amount_off_minor: number | null;
  currency: string;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface CouponUseRow {
  order_id: string;
  amount_minor: number;
  discount_total_minor: number;
  paid_at: string | null;
  status: string;
}

@Injectable()
export class AdminCouponsRepository {
  constructor(private readonly db: DbService) {}

  async list(): Promise<CouponRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CouponRow>[]>`
        select to_jsonb(c) as r from (
          select code, percent_off, amount_off_minor, currency, max_uses, used_count, expires_at, active, created_at
          from public.coupons order by created_at desc limit 500
        ) c`));
  }

  async uses(code: string): Promise<CouponUseRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<CouponUseRow>[]>`
        select to_jsonb(u) as r from (
          select id as order_id, amount_minor, discount_total_minor, paid_at, status
          from public.orders where coupon_code = ${code}::text order by created_at desc limit 200
        ) u`));
  }

  async create(adminId: string, input: {code: string; percent: number | null; amountMinor: number | null; maxUses: number | null; expiresAt: string | null}): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_create_coupon(${adminId}::uuid, ${input.code}::text, ${input.percent}::numeric, ${input.amountMinor}::bigint,
          ${input.maxUses}::integer, ${input.expiresAt}::timestamptz) as result`));
  }

  async setActive(adminId: string, code: string, active: boolean): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_set_coupon_active(${adminId}::uuid, ${code}::text, ${active}::boolean) as result`));
  }
}
