'use server';

import {z} from 'zod';
import {TIER_ORDER} from '@platform/shared';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {getCommerceClient} from './index';
import {normalizeEgyptPhone} from './phone';

const localeSchema = z.enum(routing.locales);
const phoneSchema = z.string().transform((value, context) => {
  const phone = normalizeEgyptPhone(value);
  if (!phone) context.addIssue({code: 'custom', message: 'invalid_phone'});
  return phone ?? z.NEVER;
});
const checkoutSchema = z.object({
  locale: localeSchema,
  templateSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tier: z.enum(TIER_ORDER),
  kind: z.enum(['new', 'extension', 'edits']),
  method: z.enum(['card', 'wallet', 'fawry']),
  couponCode: z.string().max(32).optional(),
  pointsToRedeem: z.number().int().nonnegative().optional(),
  couple: z.object({first: z.string().trim().min(1).max(80), second: z.string().trim().min(1).max(80)}),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function sendOtpAction(input: unknown) {
  const parsed = z.object({phone: phoneSchema}).parse(input);
  await getCommerceClient().sendOtp(parsed.phone);
  return {ok: true as const, phone: parsed.phone};
}

export async function verifyOtpAction(input: unknown) {
  const parsed = z.object({phone: phoneSchema, code: z.string().regex(/^\d{6}$/), locale: localeSchema}).parse(input);
  return getCommerceClient().verifyOtp(parsed.phone, parsed.code, parsed.locale);
}

export async function startCheckoutAction(input: unknown) {
  const parsed = checkoutSchema.parse(input);
  const order = await getCommerceClient().startCheckout(parsed);
  redirect({href: `/checkout/pay/${order.id}`, locale: parsed.locale});
}

export async function simulatePaymentAction(input: unknown) {
  const parsed = z.object({
    locale: localeSchema,
    orderId: z.string().min(1).max(80),
    outcome: z.enum(['succeed', 'fail', 'fawry_reference', 'fawry_paid']),
  }).parse(input);
  await getCommerceClient().simulatePayment(parsed.orderId, parsed.outcome);
  const destination = parsed.outcome === 'fawry_reference'
    ? `/checkout/pay/${parsed.orderId}`
    : `/checkout/result/${parsed.orderId}`;
  redirect({href: destination, locale: parsed.locale});
}
