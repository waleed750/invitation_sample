import {BadRequestException, Inject, Injectable, ServiceUnavailableException, UnprocessableEntityException} from '@nestjs/common';
import {applyDiscountCap, catalogEntry, currencyCode, fromDbTier, fromMinor, maxRedeemableEgp, toDbTier, toMinor} from '@platform/shared';
import {randomUUID} from 'node:crypto';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {CheckoutRepository} from './checkout.repository';
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
  /** Amount charged, in integer minor units of `currency`. */
  amountMinor: number;
  currency: string;
}

/** Only EGP is sold today; other currencies arrive with their gateways (BACKEND_PLAN §2b). */
const CHECKOUT_CURRENCY = 'EGP';
const EXTRA_EDITS_PRICE_MINOR = toMinor(99);
const EXTENSION_PRICE_MINOR = toMinor(199);

interface TemplateRow {
  id: string;
  entry: ReturnType<typeof catalogEntry.parse>;
}

interface StoredOrder {
  id: string;
  amountMinor: number;
  currency: string;
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/** A non-negative integer count of minor units (bigint columns may arrive as strings). */
function minorUnits(value: unknown): number | null {
  const parsed = numeric(value);
  return parsed !== null && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function storedOrder(id: unknown, amount: unknown, currency: unknown): StoredOrder {
  const amountMinor = minorUnits(amount);
  if (typeof id !== 'string' || amountMinor === null || !currencyCode.safeParse(currency).success) {
    throw new ServiceUnavailableException('Checkout service unavailable');
  }
  return {id, amountMinor, currency: currency as string};
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly repository: CheckoutRepository,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly logger: AppLogger
  ) {}

  async start(user: RequestUser, body: CheckoutBody, idempotencyKey?: string): Promise<CheckoutResponse> {
    const key = this.idempotencyKey(idempotencyKey);
    try {
      const existing = key === undefined ? null : await this.existingOrder(user.id, key);
      const order = existing ?? await this.createOrder(user, body, key);
      const checkout = await this.provider.createCheckout({id: order.id, amountMinor: order.amountMinor, currency: order.currency, method: body.method});
      await this.saveProviderRef(order.id, checkout.providerRef);
      return {
        orderId: order.id,
        redirectUrl: checkout.redirectUrl,
        ...(checkout.reference === undefined ? {} : {reference: checkout.reference}),
        amountMinor: order.amountMinor,
        currency: order.currency
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) throw error;
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
    const dbTier = toDbTier(body.tier);
    const subtotalMinor = body.kind === 'edits'
      ? EXTRA_EDITS_PRICE_MINOR
      : body.kind === 'extension'
        ? EXTENSION_PRICE_MINOR
        : await this.basePriceMinor(template.id, dbTier);
    // Discount helpers work in major units; every value crossing back is rounded to integer minor units.
    const subtotal = fromMinor(subtotalMinor);
    const couponEgp = fromMinor(await this.couponDiscountMinor(body.couponCode, subtotalMinor));
    const requestedPoints = Math.min(body.pointsToRedeem ?? 0, Math.max(0, balance));
    const requestedPointsEgp = Math.floor(requestedPoints / 100) * 50;
    const allowedPointsEgp = Math.min(requestedPointsEgp, maxRedeemableEgp(subtotal, balance));
    const firstCap = applyDiscountCap({orderTotal: subtotal, pointsEgp: allowedPointsEgp, couponEgp, affiliateEgp: 0});
    const pointsRedeemed = Math.floor(firstCap.pointsEgp / 50) * 100;
    const discount = applyDiscountCap({orderTotal: subtotal, pointsEgp: pointsRedeemed / 2, couponEgp, affiliateEgp: 0});
    const discountTotalMinor = toMinor(discount.totalDiscountEgp);
    const amountMinor = subtotalMinor - discountTotalMinor;
    const orderId = randomUUID();
    const invitationSlug = this.invitationSlug(body.couple.first, body.couple.second, orderId);
    const result: unknown = await this.repository.createPendingCheckoutAsServiceRole({
      orderId,
      userId: user.id,
      templateId: template.id,
      tier: dbTier,
      kind: body.kind,
      amountMinor,
      currency: CHECKOUT_CURRENCY,
      provider: 'mock',
      idempotencyKey: key ?? null,
      couponCode: body.couponCode?.trim().toLowerCase() ?? null,
      discountTotalMinor,
      pointsRedeemed,
      invitationSlug,
      invitationData: {event_date: body.eventDate, eventDate: body.eventDate, couple: body.couple}
    });
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) {
      this.logger.error('checkout creation RPC failed');
      throw new ServiceUnavailableException('Checkout service unavailable');
    }
    return storedOrder(result.data.order_id, result.data.amount_minor, result.data.currency);
  }

  /** Active price for the template+tier in EGP: template-specific row wins, else the tier default. */
  private async basePriceMinor(templateId: string, tier: string): Promise<number> {
    const specific = await this.priceRow(this.repository.findTemplatePrice(templateId, tier, CHECKOUT_CURRENCY));
    if (specific !== null) return specific;
    const fallback = await this.priceRow(this.repository.findTierDefaultPrice(tier, CHECKOUT_CURRENCY));
    if (fallback !== null) return fallback;
    throw new UnprocessableEntityException({code: 'price_not_found', message: 'No price is configured for this template and tier'});
  }

  private async priceRow(query: Promise<unknown>): Promise<number | null> {
    const result: unknown = await query;
    if (!isRecord(result) || result.error !== null) throw new ServiceUnavailableException('Checkout service unavailable');
    if (result.data === null || result.data === undefined) return null;
    const amount = isRecord(result.data) ? minorUnits(result.data.amount_minor) : null;
    if (amount === null || amount <= 0) throw new ServiceUnavailableException('Checkout service unavailable');
    return amount;
  }

  private async template(slug: string): Promise<TemplateRow> {
    const result: unknown = await this.repository.findLiveTemplateBySlug(slug);
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
      status: row.status,
      featured: row.featured,
      assets: []
    });
    if (!entry.success) throw new ServiceUnavailableException('Checkout service unavailable');
    return {id: templateId, entry: entry.data};
  }

  private async pointsBalance(user: RequestUser): Promise<number> {
    const result: unknown = await this.repository.findPointsBalance(user.jwt, user.id);
    if (!isRecord(result) || result.error !== null || !isRecord(result.data) || typeof result.data.points_balance !== 'number') {
      throw new ServiceUnavailableException('Checkout service unavailable');
    }
    return result.data.points_balance;
  }

  private async couponDiscountMinor(code: string | undefined, subtotalMinor: number): Promise<number> {
    if (code === undefined) return 0;
    const result: unknown = await this.repository.findCouponByCodeAsServiceRole(code.trim().toLowerCase());
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) throw new BadRequestException('Invalid coupon');
    const row = result.data;
    const expired = typeof row.expires_at === 'string' && Date.parse(row.expires_at) <= Date.now();
    const exhausted = typeof row.max_uses === 'number' && typeof row.used_count === 'number' && row.used_count >= row.max_uses;
    if (row.active !== true || expired || exhausted) throw new BadRequestException('Invalid coupon');
    const amountMinor = minorUnits(row.amount_off_minor) ?? 0;
    // A fixed-amount coupon in another currency cannot be applied to an EGP order.
    if (amountMinor > 0 && row.currency !== CHECKOUT_CURRENCY) throw new BadRequestException('Invalid coupon');
    const percent = numeric(row.percent_off) ?? 0;
    return Math.min(subtotalMinor, Math.max(amountMinor, Math.floor(subtotalMinor * percent / 100)));
  }

  private async existingOrder(userId: string, key: string): Promise<StoredOrder | null> {
    const result: unknown = await this.repository.findOrderByIdempotencyKeyAsServiceRole(userId, key);
    if (!isRecord(result) || result.error !== null) throw new ServiceUnavailableException('Checkout service unavailable');
    if (result.data === null) return null;
    if (!isRecord(result.data) || typeof result.data.id !== 'string') throw new ServiceUnavailableException('Checkout service unavailable');
    return storedOrder(result.data.id, result.data.amount_minor, result.data.currency);
  }

  private async saveProviderRef(orderId: string, providerRef: string): Promise<void> {
    const result: unknown = await this.repository.saveProviderRefAsServiceRole(orderId, providerRef);
    if (!isRecord(result) || result.error !== null) throw new ServiceUnavailableException('Checkout service unavailable');
  }

  private invitationSlug(first: string, second: string, orderId: string): string {
    const base = `${first}-${second}`.normalize('NFKD').replace(/[^a-zA-Z0-9]+/gu, '-').replace(/^-|-$/gu, '').toLowerCase();
    return `${base.length >= 3 ? base.slice(0, 45) : 'invite'}-${orderId.slice(0, 8)}`;
  }
}
