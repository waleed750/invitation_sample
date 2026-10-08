import {z} from 'zod';
import {fromDbTier, levelForPurchases, TIER_ORDER, type Tier} from '@platform/shared';
import type {Invitation, ManualPayment, Order, OrderKind, OrderStatus, PointsLedgerEntry, PublishInvitationResult} from './types';

/** Zod schemas for the API responses the web app consumes. Extra fields are tolerated (zod objects strip them). */

const localizedPair = z.object({ar: z.string(), en: z.string()});
const minor = z.number().int().nonnegative();

export const manualPaymentSchema = z.object({
  reference: z.string().min(1),
  amountMinor: minor,
  currency: z.string().min(1),
  expiresAt: z.string().min(1),
  methods: z.array(z.object({id: z.string(), label: localizedPair, details: localizedPair})),
});

export const checkoutResponseSchema = z.object({
  orderId: z.string().min(1),
  redirectUrl: z.string(),
  reference: z.string().optional(),
  amountMinor: minor,
  currency: z.string().min(1),
  payment: manualPaymentSchema.optional(),
});

export const orderSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().nullable().optional(),
  templateSlug: z.string().nullable().optional(),
  tier: z.string(),
  kind: z.enum(['new', 'extension', 'edits']),
  amountMinor: minor,
  currency: z.string().min(1),
  status: z.enum(['pending', 'paid', 'failed', 'refunded', 'expired', 'rejected']),
  provider: z.string(),
  reference: z.string().optional(),
  discountTotalMinor: minor,
  pointsRedeemed: z.number().int().nonnegative(),
  createdAt: z.string(),
  paidAt: z.string().optional(),
});
export const ordersSchema = z.array(orderSchema);

const entitlementSchema = z.object({
  editsAllowed: z.number(),
  editsUsed: z.number(),
  onlineUntil: z.string().nullable(),
  tier: z.string().nullable().optional(),
});

export const invitationSummarySchema = z.object({
  id: z.string(),
  orderId: z.string().nullable(),
  templateSlug: z.string().nullable(),
  tier: z.string().nullable(),
  shareSlug: z.string(),
  data: z.unknown(),
  status: z.string(),
  createdAt: z.string(),
  entitlement: entitlementSchema,
});
export const invitationSummariesSchema = z.array(invitationSummarySchema);

export const invitationDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  status: z.string(),
  templateId: z.string().nullable(),
  data: z.unknown(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
  entitlement: entitlementSchema,
});

export const publishResultSchema = z.discriminatedUnion('ok', [
  z.object({ok: z.literal(true), invitation: invitationDetailSchema}),
  z.object({ok: z.literal(false), reason: z.enum(['no_edits_left', 'expired', 'not_found'])}),
]);

export const pointsSchema = z.object({
  balance: z.number(),
  purchaseCount: z.number(),
  level: z.string().optional(),
  ledger: z.array(z.object({
    id: z.string(), orderId: z.string().nullable().optional(), delta: z.number(), reason: z.string(),
    createdAt: z.string(), expiresAt: z.string().nullable().optional(),
  })),
});

export const meSchema = z.object({id: z.string(), preferred_locale: z.string()});

export const apiErrorBodySchema = z.object({error: z.object({code: z.string(), message: z.string().optional()})});

/* ----- mappers ----- */

/** The API already reports web-style tier names, but tolerate raw DB names too. */
export function normalizeTier(value: string): Tier {
  return (TIER_ORDER as readonly string[]).includes(value) ? (value as Tier) : fromDbTier(value);
}


/** Only EGP is sold; integer minor units (piastres) become whole-pound numbers. */
export function minorToEgp(amountMinor: number, currency: string): number {
  if (currency !== 'EGP') throw new RangeError(`Unsupported currency: ${currency} (only EGP is supported)`);
  return amountMinor / 100;
}

export function mapManualPayment(payment: z.infer<typeof manualPaymentSchema>): ManualPayment {
  minorToEgp(payment.amountMinor, payment.currency);
  return payment;
}

/** Fixed manual-payment window (BACKEND_PLAN B7a): 72 hours from order creation. */
export const MANUAL_ORDER_TTL_MS = 72 * 60 * 60 * 1000;

export function mapOrder(raw: z.infer<typeof orderSchema>, payment?: ManualPayment): Order {
  const status: OrderStatus = raw.status === 'refunded' ? 'failed' : raw.status;
  const manual = raw.provider === 'manual';
  const order: Order = {
    id: raw.id,
    templateSlug: raw.templateSlug ?? raw.templateId ?? '',
    tier: normalizeTier(raw.tier),
    kind: raw.kind as OrderKind,
    // The API has no payment-method column for manual orders; the closest web label is a wallet transfer.
    method: manual ? 'wallet' : 'card',
    status,
    amountEgp: minorToEgp(raw.amountMinor, raw.currency),
    discountEgp: minorToEgp(raw.discountTotalMinor, raw.currency),
    ...(raw.pointsRedeemed > 0 ? {pointsRedeemed: raw.pointsRedeemed} : {}),
    createdAt: raw.createdAt,
    ...(raw.paidAt ? {paidAt: raw.paidAt} : {}),
  };
  if (manual && raw.reference && status === 'pending') {
    order.payment = payment ?? {
      reference: raw.reference,
      amountMinor: raw.amountMinor,
      currency: raw.currency,
      expiresAt: new Date(Date.parse(raw.createdAt) + MANUAL_ORDER_TTL_MS).toISOString(),
      methods: [],
    };
  }
  return order;
}

export function mapCheckoutOrder(
  response: z.infer<typeof checkoutResponseSchema>,
  input: {templateSlug: string; tier: Tier; kind: OrderKind; method: Order['method']; couponCode?: string},
  now = new Date(),
): Order {
  return {
    id: response.orderId,
    templateSlug: input.templateSlug,
    tier: input.tier,
    kind: input.kind,
    method: input.method,
    status: 'pending',
    amountEgp: minorToEgp(response.amountMinor, response.currency),
    discountEgp: 0,
    ...(input.couponCode ? {couponCode: input.couponCode} : {}),
    createdAt: now.toISOString(),
    ...(response.payment ? {payment: mapManualPayment(response.payment)} : {}),
  };
}

function localizedText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const candidate of [record.ar, record.en, ...Object.values(record)]) if (typeof candidate === 'string') return candidate;
  }
  return '';
}

/** Reads couple names and event date from checkout-seeded data or the full editor data. */
export function extractCoupleAndDate(data: unknown): {couple: {first: string; second: string}; eventDate: string} {
  const record = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const couple = (record.couple && typeof record.couple === 'object' ? record.couple : {}) as Record<string, unknown>;
  const event = (record.event && typeof record.event === 'object' ? record.event : {}) as Record<string, unknown>;
  const rawDate = localizedText(record.eventDate ?? record.event_date ?? event.date);
  return {
    couple: {
      first: localizedText(couple.first ?? couple.firstName),
      second: localizedText(couple.second ?? couple.secondName),
    },
    // Checkout stores an ISO datetime (noon, Cairo offset); the web works with calendar dates.
    eventDate: /^\d{4}-\d{2}-\d{2}T/.test(rawDate) ? rawDate.slice(0, 10) : rawDate,
  };
}

export type ApiInvitationSummary = z.infer<typeof invitationSummarySchema>;
type Detail = z.infer<typeof invitationDetailSchema>;

function invitationStatus(status: string): Invitation['status'] {
  return status === 'draft' ? 'draft' : 'published';
}

export function mapInvitationSummary(raw: ApiInvitationSummary): Invitation {
  const {couple, eventDate} = extractCoupleAndDate(raw.data);
  return {
    id: raw.id,
    orderId: raw.orderId ?? '',
    templateSlug: raw.templateSlug ?? '',
    tier: normalizeTier(raw.tier ?? raw.entitlement.tier ?? 'save-the-date'),
    couple,
    eventDate,
    status: invitationStatus(raw.status),
    editsAllowed: raw.entitlement.editsAllowed,
    editsUsed: raw.entitlement.editsUsed,
    shareSlug: raw.shareSlug,
    ...(raw.entitlement.onlineUntil ? {onlineUntil: raw.entitlement.onlineUntil} : {}),
  };
}

/** Detail has no template slug / order id; `summary` (same invitation from the list) supplies them. */
export function mapInvitationDetail(raw: Detail, summary?: ApiInvitationSummary): Invitation {
  const base = summary ? mapInvitationSummary(summary) : undefined;
  const {couple, eventDate} = extractCoupleAndDate(raw.data);
  return {
    id: raw.id,
    orderId: base?.orderId ?? '',
    templateSlug: base?.templateSlug ?? raw.templateId ?? '',
    tier: normalizeTier(raw.entitlement.tier ?? summary?.tier ?? 'save-the-date'),
    couple: couple.first || couple.second ? couple : base?.couple ?? couple,
    eventDate: eventDate || base?.eventDate || '',
    status: invitationStatus(raw.status),
    editsAllowed: raw.entitlement.editsAllowed,
    editsUsed: raw.entitlement.editsUsed,
    shareSlug: raw.slug,
    ...(raw.publishedAt ? {firstPublishedAt: raw.publishedAt} : {}),
    ...(raw.entitlement.onlineUntil ? {onlineUntil: raw.entitlement.onlineUntil} : {}),
  };
}

export function mapPublishResult(raw: z.infer<typeof publishResultSchema>, summary?: ApiInvitationSummary): PublishInvitationResult {
  return raw.ok ? {ok: true, invitation: mapInvitationDetail(raw.invitation, summary)} : {ok: false, reason: raw.reason};
}

export function mapPoints(raw: z.infer<typeof pointsSchema>) {
  const ledger: PointsLedgerEntry[] = raw.ledger.map((row) => ({
    id: row.id, delta: row.delta, reason: row.reason, createdAt: row.createdAt,
    ...(row.expiresAt ? {expiresAt: row.expiresAt} : {}),
  }));
  return {balance: raw.balance, purchaseCount: raw.purchaseCount, level: levelForPurchases(raw.purchaseCount), ledger};
}
