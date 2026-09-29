import {describe, expect, it} from 'vitest';
import {formatDate, formatMoney} from './format';

describe('formatMoney', () => {
  it.each([
    [499, 'en', 'EGP 499'], [1299, 'en', 'EGP 1,299'], [2499, 'en', 'EGP 2,499'],
    [499, 'ar', '499 ج.م'], [1299, 'ar', '1,299 ج.م'], [2499, 'ar', '2,499 ج.م'],
    [0, 'ar', '0 ج.م'], [1000000, 'en', 'EGP 1,000,000']
  ] as const)('formats %s in %s', (amount, locale, expected) => {
    expect(formatMoney(amount, locale)).toBe(expected);
  });
});

describe('formatDate', () => {
  it('uses English month names and Western digits', () => {
    expect(formatDate('2026-06-20', 'en')).toBe('20 June 2026');
  });
  it('uses Arabic month names and Western digits', () => {
    expect(formatDate('2026-06-20', 'ar')).toBe('20 يونيو 2026');
    expect(formatDate('2026-06-20', 'ar')).not.toMatch(/[٠-٩۰-۹]/);
  });
  it('uses UTC consistently for timestamps and Date objects', () => {
    const date = new Date('2026-06-20T23:30:00-03:00');
    expect(formatDate(date, 'en')).toBe('21 June 2026');
    expect(formatDate(date.getTime(), 'ar')).toBe('21 يونيو 2026');
  });
  it('rejects invalid dates', () => {
    expect(() => formatDate('invalid', 'en')).toThrow(RangeError);
  });
});
