import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Arguments of the `create_pending_checkout` RPC, in camelCase. */
export interface CreatePendingCheckoutInput {
  orderId: string;
  userId: string;
  templateId: string;
  /** DB tier value (`save_the_date` | `classic` | `premium`). */
  tier: string;
  kind: string;
  amountEgp: number;
  provider: string;
  idempotencyKey: string | null;
  couponCode: string | null;
  discountTotal: number;
  pointsRedeemed: number;
  invitationSlug: string;
  invitationData: Record<string, unknown>;
}

/** Data access for checkout. The only file here that talks to Supabase. */
@Injectable()
export class CheckoutRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Live template by slug (anonymous client, RLS applies). Raw postgrest envelope. */
  async findLiveTemplateBySlug(slug: string): Promise<unknown> {
    return this.supabase.public().from('templates')
      .select('id,slug,name,tagline,tier,price_override_egp,status,featured')
      .eq('slug', slug).eq('status', 'live').single();
  }

  /** Caller's points balance (user JWT, RLS applies). Raw postgrest envelope. */
  async findPointsBalance(jwt: string, userId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('profiles').select('points_balance').eq('id', userId).single();
  }

  /** Coupon by (already normalised) code (service role: customers cannot read coupons). */
  async findCouponByCodeAsServiceRole(code: string): Promise<unknown> {
    return this.supabase.admin().from('coupons')
      .select('percent_off,amount_off_egp,max_uses,used_count,expires_at,active')
      .eq('code', code).single();
  }

  /** Existing order for an idempotency key (service role). Raw postgrest envelope. */
  async findOrderByIdempotencyKeyAsServiceRole(userId: string, key: string): Promise<unknown> {
    return this.supabase.admin().from('orders').select('id,amount_egp')
      .eq('user_id', userId).eq('idempotency_key', key).maybeSingle();
  }

  /** Atomically creates the pending order + invitation through the RPC (service role). */
  async createPendingCheckoutAsServiceRole(input: CreatePendingCheckoutInput): Promise<unknown> {
    return this.supabase.admin().rpc('create_pending_checkout', {
      p_order_id: input.orderId,
      p_user_id: input.userId,
      p_template_id: input.templateId,
      p_tier: input.tier,
      p_kind: input.kind,
      p_amount_egp: input.amountEgp,
      p_provider: input.provider,
      p_idempotency_key: input.idempotencyKey,
      p_coupon_code: input.couponCode,
      p_discount_total: input.discountTotal,
      p_points_redeemed: input.pointsRedeemed,
      p_invitation_slug: input.invitationSlug,
      p_invitation_data: input.invitationData
    });
  }

  /** Stores the payment provider's reference on the order (service role). */
  async saveProviderRefAsServiceRole(orderId: string, providerRef: string): Promise<unknown> {
    return this.supabase.admin().from('orders').update({provider_ref: providerRef}).eq('id', orderId);
  }
}
