import {Injectable} from '@nestjs/common';
import {allJson, firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface OrderDbRow {
  id: string;
  template_id: string | null;
  tier: string;
  kind: string;
  amount_minor: number;
  currency: string;
  status: string;
  provider: string;
  provider_ref: string | null;
  discount_total_minor: number;
  points_redeemed: number;
  created_at: string;
  paid_at: string | null;
  /** Embedded template (`{slug}`), or `null` when the template is gone / hidden. */
  template: {slug: string} | null;
}

/** Data access for the caller's orders (RLS applies: `asUser`). */
@Injectable()
export class OrdersRepository {
  constructor(private readonly db: DbService) {}

  /** Owner's orders, newest first. */
  async listByUser(userId: string): Promise<OrderDbRow[]> {
    return this.db.asUser({id: userId}, async (tx) =>
      allJson(await tx<JsonRow<OrderDbRow>[]>`
        select to_jsonb(o) as r from (
          select ord.id, ord.template_id, ord.tier, ord.kind, ord.amount_minor, ord.currency, ord.status,
            ord.provider, ord.provider_ref, ord.discount_total_minor, ord.points_redeemed, ord.created_at, ord.paid_at,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = ord.template_id) as template
          from public.orders ord where ord.user_id = ${userId}::uuid
        ) o order by o.created_at desc`));
  }

  /** One of the owner's orders, or `null`. */
  async findByIdForUser(userId: string, orderId: string): Promise<OrderDbRow | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<OrderDbRow>[]>`
        select to_jsonb(o) as r from (
          select ord.id, ord.template_id, ord.tier, ord.kind, ord.amount_minor, ord.currency, ord.status,
            ord.provider, ord.provider_ref, ord.discount_total_minor, ord.points_redeemed, ord.created_at, ord.paid_at,
            (select jsonb_build_object('slug', t.slug) from public.templates t where t.id = ord.template_id) as template
          from public.orders ord where ord.id = ${orderId}::uuid and ord.user_id = ${userId}::uuid
        ) o`));
  }
}
