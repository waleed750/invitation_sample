import {describe, expect, it} from 'vitest';
import {normalizeEgyptPhone} from '../phone';

describe('normalizeEgyptPhone', () => {
  it('normalizes a local 01x number to E.164', () => {
    expect(normalizeEgyptPhone('01012345678')).toBe('+201012345678');
    expect(normalizeEgyptPhone('01112345678')).toBe('+201112345678');
    expect(normalizeEgyptPhone('01212345678')).toBe('+201212345678');
    expect(normalizeEgyptPhone('01512345678')).toBe('+201512345678');
  });

  it('accepts +20 / 0020 / 20 prefixes', () => {
    expect(normalizeEgyptPhone('+201012345678')).toBe('+201012345678');
    expect(normalizeEgyptPhone('00201012345678')).toBe('+201012345678');
    expect(normalizeEgyptPhone('201012345678')).toBe('+201012345678');
  });

  it('tolerates Arabic-Indic digits, spaces and dashes', () => {
    expect(normalizeEgyptPhone('٠١٠١٢٣٤٥٦٧٨')).toBe('+201012345678');
    expect(normalizeEgyptPhone('010 1234 5678')).toBe('+201012345678');
    expect(normalizeEgyptPhone('010-1234-5678')).toBe('+201012345678');
  });

  it('rejects invalid prefixes and non-Egyptian numbers', () => {
    expect(normalizeEgyptPhone('01312345678')).toBeNull();
    expect(normalizeEgyptPhone('0101234567')).toBeNull();
    expect(normalizeEgyptPhone('+14155552671')).toBeNull();
    expect(normalizeEgyptPhone('not-a-phone')).toBeNull();
    expect(normalizeEgyptPhone('')).toBeNull();
  });
});
