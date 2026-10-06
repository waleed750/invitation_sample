import {describe, expect, it} from 'vitest';
import {normalizeEgyptPhone} from './phone';

describe('normalizeEgyptPhone', () => {
  it.each([
    ['01012345678', '+201012345678'],
    ['+20 11 1234-5678', '+201112345678'],
    ['00201212345678', '+201212345678'],
    ['201512345678', '+201512345678'],
    ['٠١٠ ١٢٣٤-٥٦٧٨', '+201012345678'],
  ])('normalizes %s', (input, expected) => expect(normalizeEgyptPhone(input)).toBe(expected));

  it.each(['01312345678', '0101234567', '+971501234567', 'abc01012345678'])('rejects %s', (input) => {
    expect(normalizeEgyptPhone(input)).toBeNull();
  });
});

