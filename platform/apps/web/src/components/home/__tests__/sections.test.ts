import {describe, expect, it} from 'vitest';
import ar from '../../../../messages/ar.json';
import en from '../../../../messages/en.json';
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

describe('Guest list showcase messages', () => {
  it('contains sample guest names and statuses in ar and en', () => {
    expect(ar.home.how.guestList.total).toBe('42 حاضر');
    expect(en.home.how.guestList.total).toBe('42 attending');
    expect(ar.home.how.guestList.example).toBeTruthy();
    expect(en.home.how.guestList.example).toBeTruthy();
    expect(ar.home.how.guestList.guest1).toBeTruthy();
    expect(en.home.how.guestList.guest1).toBeTruthy();
  });
});

describe('Pricing trust row messages', () => {
  it('contains secure payment, one-time, and 7-day refund copy in ar and en', () => {
    expect(ar.home.pricing.trust.secure).toBe('دفع آمن');
    expect(en.home.pricing.trust.secure).toBe('Secure payment');
    expect(ar.home.pricing.trust.once).toBe('دفعة واحدة');
    expect(en.home.pricing.trust.once).toBe('One-time payment');
    expect(ar.home.pricing.trust.refund).toBe('استرجاع خلال 7 أيام قبل النشر');
    expect(en.home.pricing.trust.refund).toBe('Refund within 7 days, before you publish');
  });

  it('preserves existing Arabic plan names', () => {
    expect(ar.home.pricing.plans['save-the-date'].name).toBe('سيف ذا ديت');
    expect(ar.home.pricing.plans.classic.name).toBe('كلاسيك');
    expect(ar.home.pricing.plans.premium.name).toBe('بريميوم');
  });
});
