import {describe, expect, it} from 'vitest';
import {minorToEgp, parseEgpToMinor} from './money';

describe('parseEgpToMinor', () => {
  it('parses plain, grouped and Arabic-digit amounts', () => {
    expect(parseEgpToMinor('100')).toBe(10000);
    expect(parseEgpToMinor('1,000')).toBe(100000);
    expect(parseEgpToMinor('250.5')).toBe(25050);
    expect(parseEgpToMinor('٥٠٠')).toBe(50000);
    expect(parseEgpToMinor('١٢٣٫٤٥')).toBe(12345);
    expect(parseEgpToMinor(' 75 ')).toBe(7500);
  });
  it('rejects anything that is not a positive amount', () => {
    for (const bad of ['', '0', '-5', 'abc', '1.234', '1e3', '12 34x']) expect(parseEgpToMinor(bad)).toBeNull();
  });
  it('converts minor units to EGP', () => expect(minorToEgp(129900)).toBe(1299));
});
