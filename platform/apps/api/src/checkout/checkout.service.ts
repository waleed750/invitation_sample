import {BadRequestException, Inject, Injectable, ServiceUnavailableException} from '@nestjs/common';
import {applyDiscountCap, catalogEntry, fromDbTier, maxRedeemableEgp, priceFor} from '@platform/shared';
import {randomUUID} from 'node:crypto';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {SupabaseService} from '../supabase/supabase.service';
import {PAYMENT_PROVIDER, type PaymentProvider} from '../payments/payment-provider';

const checkoutSchema = z.object({
  templateSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tier: z.enum(['save-the-date', 'classic', 'premium']),
  kind: z.enum(['new', 'extension', 'edits']),
  method: z.enum(['card', 'wallet', 'fawry']),
  couponCode: z.string().trim().min(1).max(50).optional(),
  pointsToRedeem: z.number().int().nonnegative().optional(),
  couple: z.object({first: z.string().trim().min(1).max(100), second: z.string().trim().min(1).max(100)}).strict(),
  eventDate: z.iso.datetime({offset: true})
}).strict();
export class CheckoutBody extends createZodDto(checkoutSchema) {}

export interface CheckoutResponse {
  orderId: string;
  redirectUrl: string;
  reference?: string;
}

const EXTRA_EDITS_PRICE_EGP = 99;
const EXTENSION_PRICE_EGP = 199;

interface TemplateRow {
  id: string;
  entry: ReturnType<typeof catalogEntry.parse>;
}

interface StoredOrder {
  id: string;
  amountEgp: number;
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly supabase: SupabaseService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly logger: AppLogger
  ) {}

  async start(user: RequestUser, body: CheckoutBody, idempotencyKey?: string): Promise<CheckoutResponse> {
    const key = this.idempotencyKey(idempotencyKey);
    try {
      const existing = key === undefined ? null : await this.existingOrder(user.id, key);
      const order = existing ?? await this.createOrder(user, body, key);
      const checkout = await this.provider.createCheckout({id: order.id, amountEgp: order.amountEgp, method: body.method});
      await this.saveProviderRef(order.id, checkout.providerRef);
      return {orderId: order.id, redirectUrl: checkout.redirectUrl, ...(checkout.reference === undefined ? {} : {reference: checkout.reference})};
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('checkout failed');
      throw new ServiceUnavailableException('Checkout service unavailable');
    }
  }

  private idempotencyKey(value?: string): string | undefined {
    if (value === undefined || value.trim() === '') return undefined;
    const result = z.string().trim().min(8).max(200).safeParse(value);
    if (!result.success) throw new BadRequestException('Invalid Idempotency-Key');
    return result.data;
  }

  private async createOrder(user: RequestUser, body: CheckoutBody, key?: string): Promise<StoredOrder> {
    const template = await this.template(body.templateSlug);
    const balance = await this.pointsBalance(user);
    const subtotal = body.kind === 'edits'
      ? EXTRA_EDITS_PRICE_EGP
      : body.kind === 'extension'
        ? EXTENSION_PRICE_EGP
        : priceFor(template.entry, body.tier);
    const couponEgp = await this.couponDiscount(body.couponCode, subtotal);
    const requestedPoints = Math.min(body.pointsToRedeem ?? 0, Math.max(0, balance));
    const requestedPointsEgp = Math.floor(requestedPoints / 100) * 50;
    const allowedPointsEgp = Math.min(requestedPointsEgp, maxRedeemableEgp(subtotal, balance));
    const firstCap = applyDiscountCap({orderTotal: subtotal, pointsEgp: allowedPointsEgp, couponEgp, affiliateEgp: 0});
    const pointsRedeemed = Math.floor(firstCap.pointsEgp / 50) * 100;
    const discount = applyDiscountCap({orderTotal: subtotal, pointsEgp: pointsRedeemed / 2, couponEgp, affiliateEgp: 0});
    const amountEgp = subtotal - discount.totalDiscountEgp;
    const orderId = randomUUID();
    const invitationSlug = this.invitationSlug(body.couple.first, body.couple.second, orderId);
    const result: unknown = await this.supabase.admin().rpc('create_pending_checkout', {
      p_order_id: orderId,
      p_user_id: user.id,
      p_template_id: template.id,
      p_tier: body.tier === 'save-the-date' ? 'save_the_date' : body.tier,
      p_kind: body.kind,
      p_amount_egp: amountEgp,
      p_provider: 'mock',
      p_idempotency_key: key ?? null,
      p_coupon_code: body.couponCode?.trim().toLowerCase() ?? null,
      p_discount_total: discount.totalDiscountEgp,
      p_points_redeemed: pointsRedeemed,
      p_invitation_slug: invitationSlug,
      p_invitation_data: {event_date: body.eventDate, eventDate: body.eventDate, couple: body.couple}
    });
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) {
      this.logger.error('checkout creation RPC failed');
      throw new ServiceUnavailableException('Checkout service unavailable');
    }
    const id = result.data.order_id;
    const amount = numeric(result.data.amount_egp);
    if (typeof id !== 'string' || amount === null) throw new ServiceUnavailableException('Checkout service unavailable');
    return {id, amountEgp: amount};
  }

  private async template(slug: string): Promise<TemplateRow> {
    const result: unknown = await this.supabase.public().from('templates')
      .select('id,slug,name,tagline,tier,price_override_egp,status,featured')
      .eq('slug', slug).eq('status', 'live').single();
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) {
      throw new BadRequestException('Unknown or unavailable template');
    }
    const row = result.data;
    const templateId = row.id;
    if (typeof templateId !== 'string') throw new BadRequestException('Unknown or unavailable template');
    const entry = catalogEntry.safeParse({
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      tier: typeof row.tier === 'string' ? fromDbTier(row.tier) : row.tier,
      priceOverrideEgp: row.price_override_egp === null ? undefined : row.price_override_egp,
      status: row.status,
      featured: row.featured,
      assets: []
    });
    if (!entry.success) throw new ServiceUnavailableException('Checkout service unavailable');
    return {id: templateId, entry: entry.data};
  }

  private async pointsBalance(user: RequestUser): Promise<number> {
    const result: unknown = await this.supabase.forUser(user.jwt).from('profiles').select('points_balance').eq('id', user.id).single();
    if (!isRecord(result) || result.error !== null || !isRecord(result.data) || typeof result.data.points_balance !== 'number') {
      throw new ServiceUnavailableException('Checkout service unavailable');
    }
    return result.data.points_balance;
  }

  private async couponDiscount(code: string | undefined, subtotal: number): Promise<number> {
    if (code === undefined) return 0;
    const result: unknown = await this.supabase.admin().from('coupons')
      .select('percent_off,amount_off_egp,max_uses,used_count,expires_at,active')
      .eq('code', code.trim().toLowerCase()).single();
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) throw new BadRequestException('Invalid coupon');
    const row = result.data;
    const expired = typeof row.expires_at === 'string' && Date.parse(row.expires_at) <= Date.now();
    const exhausted = typeof row.max_uses === 'number' && typeof row.used_count === 'number' && row.used_count >= row.max_uses;
    if (row.active !== true || expired || exhausted) throw new BadRequestException('Invalid coupon');
    const amount = numeric(row.amount_off_egp) ?? 0;
    const percent = numeric(row.percent_off) ?? 0;
    return Math.min(subtotal, Math.max(amount, Math.floor(subtotal * percent) / 100));
  }

  private async existingOrder(userId: string, key: string): Promise<StoredOrder | null> {
    const result: unknown = await this.supabase.admin().from('orders').select('id,amount_egp')
      .eq('user_id', userId).eq('idempotency_key', key).maybeSingle();
    if (!isRecord(result) || result.error !== null) throw new ServiceUnavailableException('Checkout service unavailable');
    if (result.data === null) return null;
    if (!isRecord(result.data) || typeof result.data.id !== 'string') throw new ServiceUnavailableException('Checkout service unavailable');
    const amount = numeric(result.data.amount_egp);
    if (amount === null) throw new ServiceUnavailableException('Checkout service unavailable');
    return {id: result.data.id, amountEgp: amount};
  }

  private async saveProviderRef(orderId: string, providerRef: string): Promise<void> {
    const result: unknown = await this.supabase.admin().from('orders').update({provider_ref: providerRef}).eq('id', orderId);
    if (!isRecord(result) || result.error !== null) throw new ServiceUnavailableException('Checkout service unavailable');
  }

  private invitationSlug(first: string, second: string, orderId: string): string {
    const base = `${first}-${second}`.normalize('NFKD').replace(/[^a-zA-Z0-9]+/gu, '-').replace(/^-|-$/gu, '').toLowerCase();
    return `${base.length >= 3 ? base.slice(0, 45) : 'invite'}-${orderId.slice(0, 8)}`;
  }
}
