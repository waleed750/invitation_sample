import {describe, expect, it} from 'vitest';
import {activeStepFromIntersections, clampStep, easeOut, easedCount} from '../journey/helpers';

describe('activeStepFromIntersections', () => {
  it('returns 0 when nothing is intersecting', () => {
    expect(activeStepFromIntersections([
      {step: 1, ratio: 0, isIntersecting: false},
      {step: 2, ratio: 0.4, isIntersecting: false},
    ])).toBe(0);
  });

  it('picks the only intersecting step', () => {
    expect(activeStepFromIntersections([
      {step: 1, ratio: 0.9, isIntersecting: true},
      {step: 2, ratio: 0, isIntersecting: false},
    ])).toBe(1);
  });

  it('picks the most visible step', () => {
    expect(activeStepFromIntersections([
      {step: 1, ratio: 0.35, isIntersecting: true},
      {step: 2, ratio: 0.8, isIntersecting: true},
    ])).toBe(2);
  });

  it('prefers the later step on an exact tie', () => {
    expect(activeStepFromIntersections([
      {step: 2, ratio: 0.5, isIntersecting: true},
      {step: 3, ratio: 0.5, isIntersecting: true},
    ])).toBe(3);
  });

  it('ignores non-finite ratios', () => {
    expect(activeStepFromIntersections([
      {step: 1, ratio: Number.NaN, isIntersecting: true},
      {step: 2, ratio: 1, isIntersecting: true},
    ])).toBe(2);
  });
});

describe('clampStep', () => {
  it('clamps integers into 1..3', () => {
    expect(clampStep(0)).toBe(1);
    expect(clampStep(1)).toBe(1);
    expect(clampStep(2)).toBe(2);
    expect(clampStep(3)).toBe(3);
    expect(clampStep(9)).toBe(3);
    expect(clampStep(-4)).toBe(1);
  });

  it('rounds decimals', () => {
    expect(clampStep(1.4)).toBe(1);
    expect(clampStep(2.6)).toBe(3);
  });

  it('falls back to 1 for non-finite input', () => {
    expect(clampStep(Number.NaN)).toBe(1);
    expect(clampStep(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('easeOut', () => {
  it('clamps the input range', () => {
    expect(easeOut(-1)).toBe(0);
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(2)).toBe(1);
  });

  it('eases out (fast early, slow late)', () => {
    expect(easeOut(0.5)).toBeCloseTo(0.875);
    expect(easeOut(0.1)).toBeGreaterThan(0.1);
    expect(easeOut(0.9)).toBeCloseTo(0.999);
    expect(easeOut(0.9)).toBeGreaterThan(0.9);
  });
});

describe('easedCount', () => {
  it('maps eased progress to a whole count in range', () => {
    expect(easedCount(0, 128)).toBe(0);
    expect(easedCount(1, 128)).toBe(128);
    expect(easedCount(0.5, 128)).toBe(112);
    expect(easedCount(-0.5, 128)).toBe(0);
    expect(easedCount(2, 128)).toBe(128);
  });
});