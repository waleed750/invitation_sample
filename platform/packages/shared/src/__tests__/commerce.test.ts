import {describe, expect, it} from 'vitest';
import {TIERS, computeOnlineUntil, canPublish, remainingEdits, daysOnlineLeft, pointsForOrder, levelForPurchases, maxRedeemableEgp, applyDiscountCap, type Tier} from '../index';

const firstPublishedAt = new Date('2026-01-15T12:00:00Z');
describe('entitlements', () => {
  for (const [tier, monthEnd, graceEnd] of [
    ['save-the-date', '2026-04-15T12:00:00Z', '2028-01-08T12:00:00Z'],
    ['classic', '2026-07-15T12:00:00Z', '2028-01-15T12:00:00Z'],
    ['premium', '2027-01-15T12:00:00Z', '2028-01-31T12:00:00Z']
  ] satisfies [Tier, string, string][]) {
    it(`${tier}: uses online period for an early event`, () => expect(computeOnlineUntil({tier, firstPublishedAt, eventDate: new Date('2026-01-16T12:00:00Z')})).toEqual(new Date(monthEnd)));
    it(`${tier}: uses event grace period for a late event`, () => expect(computeOnlineUntil({tier, firstPublishedAt, eventDate: new Date('2028-01-01T12:00:00Z')})).toEqual(new Date(graceEnd)));
  }
  it('clamps month ends and leap days without mutating inputs', () => {
    const published = new Date('2026-01-31T12:30:00Z');
    const eventDate = new Date('2026-02-01T12:30:00Z');
    expect(computeOnlineUntil({tier: 'save-the-date', firstPublishedAt: published, eventDate})).toEqual(new Date('2026-04-30T12:30:00Z'));
    expect(published.toISOString()).toBe('2026-01-31T12:30:00.000Z');
    expect(eventDate.toISOString()).toBe('2026-02-01T12:30:00.000Z');
    expect(computeOnlineUntil({tier: 'premium', firstPublishedAt: new Date('2024-02-29T00:00:00Z'), eventDate: new Date('2024-03-01T00:00:00Z')})).toEqual(new Date('2025-02-28T00:00:00Z'));
  });
  const onlineUntil = new Date('2026-07-01T00:00:00Z');
  it('uses exclusive expiry and exact edit limits', () => {
    expect(canPublish({editsAllowed: 5, editsUsed: 5, onlineUntil, now: firstPublishedAt})).toEqual({ok: false, reason: 'no_edits_left'});
    expect(canPublish({editsAllowed: 5, editsUsed: 4, onlineUntil, now: onlineUntil})).toEqual({ok: false, reason: 'expired'});
    expect(canPublish({editsAllowed: 5, editsUsed: 4, onlineUntil, now: new Date(onlineUntil.getTime() - 1)})).toEqual({ok: true});
    expect(canPublish({editsAllowed: 5, editsUsed: 5, onlineUntil, now: onlineUntil})).toEqual({ok: false, reason: 'no_edits_left'});
  });
  it('clamps meters and rounds partial days up', () => {
    expect(remainingEdits({editsAllowed: 5, editsUsed: 2})).toBe(3);
    expect(remainingEdits({editsAllowed: 5, editsUsed: 6})).toBe(0);
    expect(daysOnlineLeft({onlineUntil, now: onlineUntil})).toBe(0);
    expect(daysOnlineLeft({onlineUntil, now: new Date(onlineUntil.getTime() - 1)})).toBe(1);
    expect(daysOnlineLeft({onlineUntil, now: new Date('2026-07-02T00:00:00Z')})).toBe(0);
  });
  it('represents unlimited switches as null', () => expect(TIERS.premium.templateSwitches).toBeNull());
  it('rejects invalid dates and counts', () => {
    expect(() => daysOnlineLeft({onlineUntil, now: new Date('invalid')})).toThrow(RangeError);
    expect(() => remainingEdits({editsAllowed: -1, editsUsed: 0})).toThrow(RangeError);
  });
});

describe('points', () => {
  it.each([
    ['member', 199.99, 19], ['silver', 199.99, 20], ['gold', 199.99, 23],
    ['member', 9.99, 0], ['silver', 9.99, 0], ['gold', 9.99, 0],
    ['silver', 1000, 110], ['gold', 1000, 125]
  ] as const)('%s points for %s = %s', (level, amount, expected) => expect(pointsForOrder(amount, level)).toBe(expected));
  it.each([[0, 'member'], [1, 'member'], [2, 'silver'], [3, 'silver'], [4, 'gold'], [10, 'gold']] as const)('level for %s purchases', (count, expected) => expect(levelForPurchases(count)).toBe(expected));
  it.each([[1000, 99, 0], [1000, 199, 50], [1000, 250, 100], [1000, 10000, 300], [499, 10000, 100], [100, 10000, 0], [1000, -100, 0], [0, 100, 0]])('redeems whole blocks for order %s / balance %s', (total, balance, expected) => expect(maxRedeemableEgp(total, balance)).toBe(expected));
  it('reduces points, then coupons, then affiliate to the 30% cap', () => {
    expect(applyDiscountCap({orderTotal: 1000, pointsEgp: 200, couponEgp: 100, affiliateEgp: 100})).toEqual({pointsEgp: 100, couponEgp: 100, affiliateEgp: 100, totalDiscountEgp: 300});
    expect(applyDiscountCap({orderTotal: 1000, pointsEgp: 200, couponEgp: 250, affiliateEgp: 200})).toEqual({pointsEgp: 0, couponEgp: 100, affiliateEgp: 200, totalDiscountEgp: 300});
    expect(applyDiscountCap({orderTotal: 1000, pointsEgp: 200, couponEgp: 250, affiliateEgp: 400})).toEqual({pointsEgp: 0, couponEgp: 0, affiliateEgp: 300, totalDiscountEgp: 300});
  });
  it('preserves discounts below the cap and floors the cap to whole piastres', () => {
    expect(applyDiscountCap({orderTotal: 1000, pointsEgp: 50, couponEgp: 20, affiliateEgp: 10}).totalDiscountEgp).toBe(80);
    expect(applyDiscountCap({orderTotal: 99.99, pointsEgp: 50, couponEgp: 0, affiliateEgp: 0}).totalDiscountEgp).toBe(29.99);
  });
  it('rejects invalid commerce inputs', () => {
    expect(() => pointsForOrder(-1, 'member')).toThrow(RangeError);
    expect(() => pointsForOrder(NaN, 'gold')).toThrow(RangeError);
    expect(() => levelForPurchases(1.5)).toThrow(RangeError);
    expect(() => maxRedeemableEgp(100, Infinity)).toThrow(RangeError);
    expect(() => applyDiscountCap({orderTotal: 100, pointsEgp: -1, couponEgp: 0, affiliateEgp: 0})).toThrow(RangeError);
  });
});
