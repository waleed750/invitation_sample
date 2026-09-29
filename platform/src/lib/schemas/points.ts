export type Level = 'member' | 'silver' | 'gold';
function nonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Expected a finite non-negative number');
  return value;
}
function money(value: number): number {
  const cents = Math.round(nonNegative(value) * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(cents / 100 - value) > 1e-8) throw new RangeError('Expected money with at most two decimals');
  return cents;
}
export function pointsForOrder(amountPaidEgp: number, level: Level): number {
  const base = Math.floor(nonNegative(amountPaidEgp) / 10);
  return Math.floor(base * ({member: 100, silver: 110, gold: 125}[level]) / 100);
}
export function levelForPurchases(count: number): Level {
  if (!Number.isSafeInteger(nonNegative(count))) throw new RangeError('Expected an integer purchase count');
  return count >= 4 ? 'gold' : count >= 2 ? 'silver' : 'member';
}
export function maxRedeemableEgp(orderTotal: number, balance: number): number {
  if (!Number.isSafeInteger(balance)) throw new RangeError('Expected an integer points balance');
  const cap = Math.floor(money(orderTotal) * 30 / 100);
  return Math.min(Math.floor(Math.max(0, balance) / 100), Math.floor(cap / 5000)) * 50;
}
export function applyDiscountCap({orderTotal, pointsEgp, couponEgp, affiliateEgp}: {orderTotal: number; pointsEgp: number; couponEgp: number; affiliateEgp: number}) {
  const cap = Math.floor(money(orderTotal) * 30 / 100);
  let points = money(pointsEgp);
  let coupon = money(couponEgp);
  let affiliate = money(affiliateEgp);
  let excess = Math.max(0, points + coupon + affiliate - cap);
  const pointsReduction = Math.min(points, excess);
  points -= pointsReduction; excess -= pointsReduction;
  const couponReduction = Math.min(coupon, excess);
  coupon -= couponReduction; excess -= couponReduction;
  affiliate -= Math.min(affiliate, excess);
  return {pointsEgp: points / 100, couponEgp: coupon / 100, affiliateEgp: affiliate / 100, totalDiscountEgp: (points + coupon + affiliate) / 100};
}
