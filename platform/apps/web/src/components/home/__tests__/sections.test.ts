import {describe, expect, it} from 'vitest';
import {pad2, STEP_KEYS} from '../HowItWorks';

describe('pad2', () => {
  it('pads a single digit to a two-digit Western numeral', () => {
    expect(pad2(1)).toBe('01');
    expect(pad2(3)).toBe('03');
    expect(pad2(9)).toBe('09');
  });

  it('leaves two-digit values alone', () => {
    expect(pad2(10)).toBe('10');
    expect(pad2(12)).toBe('12');
    expect(pad2(123)).toBe('123');
  });

  it('always emits ASCII digits, never Arabic-Indic ones', () => {
    for (let value = 0; value <= 99; value += 1) {
      expect(pad2(value)).toMatch(/^[0-9]+$/);
    }
  });
});

describe('STEP_KEYS', () => {
  it('covers the three step keys in reading order', () => {
    expect(STEP_KEYS).toEqual(['s1', 's2', 's3']);
  });

  it('numbers the steps 01, 02, 03', () => {
    expect(STEP_KEYS.map((key, index) => `${key}:${pad2(index + 1)}`)).toEqual(['s1:01', 's2:02', 's3:03']);
  });
});
