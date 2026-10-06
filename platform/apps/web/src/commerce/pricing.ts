import {applyDiscountCap, maxRedeemableEgp, priceFor, type Tier} from '@platform/shared';
import {getTemplate} from '../templates/registry';
import type {OrderKind} from './types';

export const EXTRA_EDITS_PRICE_EGP = 99;
export const EXTENSION_PRICE_EGP = 199;

const COUPONS: Record<string, number> = {WELCOME10: 10};

export interface QuoteInput {
  templateSlug: string;
  tier: Tier;
  kind: OrderKind;
  couponCode?: string;
  pointsToRedeem?: number;
  balance: number;
}

export interface Quote {
  subtotal: number;
  discount: number;
  total: number;
}

export function quote(input: QuoteInput): Quote {
  const template = getTemplate(input.templateSlug);
  if (!template || template.entry.status !== 'live') throw new RangeError('Unknown or unavailable template');

  const subtotal = input.kind === 'edits'
    ? EXTRA_EDITS_PRICE_EGP
    : input.kind === 'extension'
      ? EXTENSION_PRICE_EGP
      : priceFor(template.entry, input.tier);
  const couponPercent = COUPONS[input.couponCode?.trim().toUpperCase() ?? ''] ?? 0;
  const couponEgp = Math.floor(subtotal * couponPercent) / 100;
  const requestedPoints = Math.max(0, Math.floor(input.pointsToRedeem ?? 0));
  const requestedPointsEgp = Math.floor(Math.min(requestedPoints, input.balance) / 100) * 50;
  const pointsEgp = Math.min(requestedPointsEgp, maxRedeemableEgp(subtotal, input.balance));
  const capped = applyDiscountCap({orderTotal: subtotal, pointsEgp, couponEgp, affiliateEgp: 0});

  return {
    subtotal,
    discount: capped.totalDiscountEgp,
    total: subtotal - capped.totalDiscountEgp,
  };
}
