/* eslint-disable */
import {buildManualPayment, MANUAL_ORDER_TTL_MS} from './manual-payment';

describe('buildManualPayment', () => {
  const methods = [{kind: 'instapay', label: 'InstaPay', value: 'x@instapay'}] as any;

  it('expires 72 h after creation and carries reference, amount, currency and methods', () => {
    expect(buildManualPayment({
      reference: 'MAN-1', amountMinor: 5000, currency: 'EGP', createdAt: '2026-01-01T00:00:00.000Z', instructions: {methods} as any
    })).toEqual({reference: 'MAN-1', amountMinor: 5000, currency: 'EGP', expiresAt: '2026-01-04T00:00:00.000Z', methods});
  });

  it('defaults methods to [] and createdAt to now', () => {
    const before = Date.now();
    const block = buildManualPayment({reference: 'R', amountMinor: 1, currency: 'EGP'});
    expect(block.methods).toEqual([]);
    expect(Date.parse(block.expiresAt)).toBeGreaterThanOrEqual(before + MANUAL_ORDER_TTL_MS);
  });

  it('falls back to now for an unparsable createdAt', () => {
    const block = buildManualPayment({reference: 'R', amountMinor: 1, currency: 'EGP', createdAt: 'garbage'});
    expect(Number.isNaN(Date.parse(block.expiresAt))).toBe(false);
  });
});
