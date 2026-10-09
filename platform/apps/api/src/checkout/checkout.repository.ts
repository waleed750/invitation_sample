import {Injectable} from '@nestjs/common';
import {firstJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

/** Arguments of the `create_pending_checkout` RPC, in camelCase. */
export interface CreatePendingCheckoutInput {
  orderId: string;
  userId: string;
  templateId: string;
  /** DB tier value (`save_the_date` | `classic` | `premium`). */
  tier: string;
  kind: string;
  amountMinor: number;
  currency: string;
  provider: string;
  idempotencyKey: string | null;
  couponCode: string | null;
  discountTotalMinor: number;
  pointsRedeemed: number;
  invitationSlug: string;
  invitationData: Record<string, unknown>;
}

export interface LiveTemplateDbRow {
  id: string;
  slug: string;
  name: unknown;
  tagline: unknown;
  tier: string;
  status: string;
  featured: boolean;
}

export interface CouponDbRow {
  percent_off: number | null;
  amount_off_minor: number | null;
  currency: string;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
}

export interface ExistingOrderDbRow {
  id: string;
  amount_minor: number;
  currency: string;
  provider_ref: string | null;
  created_at: string;
}

/** Data access for checkout. */
@Injectable()
export class CheckoutRepository {
  constructor(private readonly db: DbService) {}

  /** Live template by slug (anonymous role, RLS applies), or `null`. */
  async findLiveTemplateBySlug(slug: string): Promise<LiveTemplateDbRow | null> {
    return this.db.asAnon(async (tx) =>
      firstJson(await tx<JsonRow<LiveTemplateDbRow>[]>`
        select to_jsonb(t) as r from (
          select id, slug, name, tagline, tier, status, featured
          from public.templates where slug = ${slug}::text and status = 'live'
        ) t`));
  }

  /** Active template-specific price in minor units (anonymous role; RLS exposes active rows only), or `null`. */
  async findTemplatePrice(templateId: string, tier: string, currency: string): Promise<{amount_minor: number} | null> {
    return this.db.asAnon(async (tx) =>
      firstJson(await tx<JsonRow<{amount_minor: number}>[]>`
        select to_jsonb(p) as r from (
          select amount_minor from public.prices
          where template_id = ${templateId}::uuid and tier = ${tier}::text and currency = ${currency}::text and active
        ) p`));
  }

  /** Active tier-default price, i.e. `template_id is null` (anonymous role), or `null`. */
  async findTierDefaultPrice(tier: string, currency: string): Promise<{amount_minor: number} | null> {
    return this.db.asAnon(async (tx) =>
      firstJson(await tx<JsonRow<{amount_minor: number}>[]>`
        select to_jsonb(p) as r from (
          select amount_minor from public.prices
          where template_id is null and tier = ${tier}::text and currency = ${currency}::text and active
        ) p`));
  }

  /** Caller's points balance (RLS applies), or `null` when no profile is visible. */
  async findPointsBalance(userId: string): Promise<{points_balance: number} | null> {
    return this.db.asUser({id: userId}, async (tx) =>
      firstJson(await tx<JsonRow<{points_balance: number}>[]>`
        select to_jsonb(p) as r from (
          select points_balance from public.profiles where id = ${userId}::uuid
        ) p`));
  }

  /** Coupon by (already normalised) code (service role: customers cannot read coupons), or `null`. */
  async findCouponByCodeAsServiceRole(code: string): Promise<CouponDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<CouponDbRow>[]>`
        select to_jsonb(c) as r from (
          select percent_off, amount_off_minor, currency, max_uses, used_count, expires_at, active
          from public.coupons where code = ${code}::text
        ) c`));
  }

  /** Existing order for an idempotency key (service role), or `null`. */
  async findOrderByIdempotencyKeyAsServiceRole(userId: string, key: string): Promise<ExistingOrderDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<ExistingOrderDbRow>[]>`
        select to_jsonb(o) as r from (
          select id, amount_minor, currency, provider_ref, created_at
          from public.orders where user_id = ${userId}::uuid and idempotency_key = ${key}::text
        ) o`));
  }

  /** Atomically creates the pending order + invitation through the RPC (service role). */
  async createPendingCheckoutAsServiceRole(input: CreatePendingCheckoutInput): Promise<RpcObject | null> {
    const invitationData = JSON.stringify(input.invitationData);
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.create_pending_checkout(
          ${input.orderId}::uuid,
          ${input.userId}::uuid,
          ${input.templateId}::uuid,
          ${input.tier}::text,
          ${input.kind}::text,
          ${input.amountMinor}::bigint,
          ${input.currency}::text,
          ${input.provider}::text,
          ${input.idempotencyKey}::text,
          ${input.couponCode}::text,
          ${input.discountTotalMinor}::bigint,
          ${input.pointsRedeemed}::integer,
          ${input.invitationSlug}::text,
          ${invitationData}::text::jsonb
        ) as result`));
  }

  /** Stores the payment provider's reference on the order (service role). */
  async saveProviderRefAsServiceRole(orderId: string, providerRef: string): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`update public.orders set provider_ref = ${providerRef}::text where id = ${orderId}::uuid`;
    });
  }
}
