import {describe, expect, it} from 'vitest';
import {migrate} from '@platform/shared';
import {extractCoupleAndDate, mapPoints, pointsSchema} from './api-schemas';

describe('extractCoupleAndDate', () => {
  it('reads checkout-seeded data', () => {
    expect(extractCoupleAndDate({couple: {first: 'سارة', second: 'علي'}, eventDate: '2027-06-15T12:00:00+02:00'}))
      .toEqual({couple: {first: 'سارة', second: 'علي'}, eventDate: '2027-06-15'});
  });

  it('reads a saved editor document (names and date live under meta)', () => {
    const doc = migrate({couple: {first: 'سارة', second: 'علي'}, eventDate: '2027-06-15'});
    const out = extractCoupleAndDate(doc);
    expect(out.couple.first).toBe('سارة');
    expect(out.eventDate).toBe('2027-06-15');
  });

  it('never throws on junk', () => {
    expect(extractCoupleAndDate(null)).toEqual({couple: {first: '', second: ''}, eventDate: ''});
  });
});

describe('points response', () => {
  it('maps optional spendable, expiry and referral fields', () => {
    const raw = pointsSchema.parse({balance: 250, purchaseCount: 1, ledger: [], spendable: 150,
      expiringSoon: {points: 40, firstExpiry: '2026-11-03T00:00:00Z', days: 30},
      referral: {code: 'f-abcd2345', invited: 2, rewarded: 1, rewardPoints: 100}});
    expect(mapPoints(raw)).toMatchObject({spendable: 150, expiringSoon: {points: 40}, referral: {code: 'f-abcd2345', rewarded: 1}});
  });
});
