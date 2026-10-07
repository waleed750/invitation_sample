import {describe, expect, it} from 'vitest';
import {currencyCode, fromMinor, toMinor, type Money} from '../money';

describe('money', () => {
  it('converts major units to integer minor units', () => {
    expect(toMinor(1299)).toBe(129900);
    expect(toMinor(0)).toBe(0);
    expect(toMinor(12.5)).toBe(1250);
    expect(Number.isInteger(toMinor(19.99))).toBe(true);
    expect(toMinor(19.99)).toBe(1999);
  });

  it('converts minor units back to major units', () => {
    expect(fromMinor(129900)).toBe(1299);
    expect(fromMinor(1999)).toBe(19.99);
  });

  it('round-trips whole minor amounts', () => {
    for (const minor of [0, 1, 99, 100, 49900, 129900, 249900, 99999999]) {
      expect(toMinor(fromMinor(minor))).toBe(minor);
    }
  });

  it('validates currency codes', () => {
    expect(currencyCode.safeParse('EGP').success).toBe(true);
    expect(currencyCode.safeParse('USD').success).toBe(true);
    expect(currencyCode.safeParse('egp').success).toBe(false);
    expect(currencyCode.safeParse('EG').success).toBe(false);
    expect(currencyCode.safeParse('EGPX').success).toBe(false);
  });

  it('types Money as minor units + currency', () => {
    const money: Money = {amountMinor: 129900, currency: 'EGP'};
    expect(money.amountMinor).toBe(129900);
  });
});
