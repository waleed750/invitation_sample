import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface RefundableOrderRow {
  id: string;
  status: string;
  kind: string;
  tier: string;
  amount_minor: number;
  paid_amount_minor: number | null;
  currency: string;
  provider: string;
  paid_at: string | null;
  refunded_at: string | null;
  customer_email: string | null;
  customer_phone: string | null;
}

@Injectable()
export class AdminRefundsRepository {
  constructor(private readonly db: DbService) {}

  /** Recent paid and refunded orders, optionally narrowed by the short code, the customer's email or phone. */
  async search(query: string | null): Promise<RefundableOrderRow[]> {
    const like = query === null ? null : `%${query.replaceAll(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<RefundableOrderRow>[]>`
        select to_jsonb(x) as r from (
          select o.id, o.status, o.kind, o.tier, o.amount_minor, o.paid_amount_minor, o.currency, o.provider, o.paid_at, o.refunded_at,
                 p.email as customer_email, p.phone as customer_phone
          from public.orders o left join public.profiles p on p.id = o.user_id
          where o.status in ('paid', 'refunded')
            and (${like}::text is null or o.id::text ilike ${like}::text or p.email ilike ${like}::text or p.phone ilike ${like}::text)
          order by coalesce(o.refunded_at, o.paid_at, o.created_at) desc limit 100
        ) x`));
  }

  async markRefunded(adminId: string, orderId: string, note: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`select public.admin_mark_refunded(${adminId}::uuid, ${orderId}::uuid, ${note}::text) as result`));
  }
}
