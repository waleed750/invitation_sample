import {describe, expect, it} from 'vitest';
import {formatEgp, orderCode} from './format';

describe('receipt formatting', () => {
  it('keeps piasters and uses Latin digits', () => {
    expect(formatEgp(1299.07, 'en')).toBe('EGP 1,299.07');
    expect(formatEgp(1299, 'ar')).toBe('1,299.00 ج.م');
  });
  it('shortens an order id', () => {
    expect(orderCode('1a2b3c4d-0000-4000-8000-000000000000')).toBe('#D-1A2B3C4D');
  });
});
