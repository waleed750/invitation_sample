import {beforeAll, describe, expect, it, vi} from 'vitest';

vi.mock('next/font/local', () => ({
  default: (opts: { variable?: string }) => ({variable: opts.variable || '--mock-font'}),
}));

describe('quote', () => {
  let quote: typeof import('./pricing').quote;

  beforeAll(async () => { ({quote} = await import('./pricing')); });

  it('uses the catalog tier price and demo coupon', () => {
    expect(quote({templateSlug: 'mashrabiya', tier: 'classic', kind: 'new', couponCode: 'welcome10', balance: 0}))
      .toEqual({subtotal: 1299, discount: 129.9, total: 1169.1});
  });

  it('uses fixed add-on prices', () => {
    expect(quote({templateSlug: 'mashrabiya', tier: 'classic', kind: 'edits', balance: 0}).subtotal).toBe(99);
    expect(quote({templateSlug: 'mashrabiya', tier: 'classic', kind: 'extension', balance: 0}).subtotal).toBe(199);
  });

  it('caps combined discounts at 30 percent and reduces points first', () => {
    expect(quote({
      templateSlug: 'mashrabiya', tier: 'classic', kind: 'new', couponCode: 'WELCOME10',
      pointsToRedeem: 10_000, balance: 10_000,
    })).toEqual({subtotal: 1299, discount: 389.7, total: 909.3});
  });

  it('rejects unknown templates', () => {
    expect(() => quote({templateSlug: 'missing', tier: 'classic', kind: 'new', balance: 0})).toThrow(RangeError);
  });
});

