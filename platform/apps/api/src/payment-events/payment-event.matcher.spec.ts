import type {ParsedEvent} from './payment-event-provider';
import {matchPaymentEvent, paymentReferences, type PaymentCandidate} from './payment-event.matcher';
const NOW = Date.parse('2026-10-09T12:00:00Z');
const order: PaymentCandidate = {id: 'one', reference: 'INV-ABC123', amountMinor: 129900, extraMinor: 37, currency: 'EGP', createdAt: '2026-10-09T11:00:00Z', status: 'pending', provider: 'manual'};
const event: ParsedEvent = {externalId: 'external', amountMinor: 129937, currency: 'EGP', receivedAt: '2026-10-09T11:30:00Z'};
const match = (ev = event, orders = [order]) => matchPaymentEvent(ev, orders, NOW);

describe('payment matcher', () => {
  it.each(['INV-ABC123', 'inv abc123', 'inv - a b c - 1 2 3'])('recognizes reference %s before amount matching', (referenceText) => {
    expect(match({...event, referenceText}, [order, {...order, id: 'two', reference: 'INV-DEF456'}])).toEqual({status: 'matched', orderId: 'one', reason: 'reference'});
  });
  it('matches a unique allocation', () => { expect(match()).toEqual({status: 'matched', orderId: 'one', reason: 'unique_amount'}); });
  it('matches an unallocated exact base', () => { expect(match({...event, amountMinor: 129900}, [{...order, extraMinor: null}]).status).toBe('matched'); });
  it('never matches allocated orders at base amount', () => { expect(match({...event, amountMinor: 129900}).status).toBe('unmatched'); });
  it('marks multiple equal totals ambiguous', () => { expect(match(event, [order, {...order, id: 'two'}]).status).toBe('ambiguous'); });
  it('includes unallocated orders in ambiguity detection', () => { expect(match(event, [order, {...order, id: 'two', amountMinor: 129937, extraMinor: null}]).status).toBe('ambiguous'); });
  it.each([{amountMinor: 1}, {currency: 'USD'}])('does not fall back when reference amount/currency mismatches', (patch) => {
    expect(match({...event, ...patch, referenceText: 'INV-ABC123'})).toEqual({status: 'unmatched', reason: 'amount_mismatch'});
  });
  it('does not fall back for an unknown reference', () => { expect(match({...event, referenceText: 'INV-DEF456'}).status).toBe('unmatched'); });
  it('handles no candidates', () => { expect(match(event, [])).toEqual({status: 'unmatched', reason: 'no_match'}); });
  it('handles no exact amount', () => { expect(match({...event, amountMinor: 99}).status).toBe('unmatched'); });
  it('marks multiple references ambiguous', () => { expect(match({...event, referenceText: 'INV-ABC123 and INV-DEF456'}).status).toBe('ambiguous'); });
  it('deduplicates repeated references and rejects overlong codes', () => {
    expect(paymentReferences('INV-ABC123, inv-abc123')).toEqual(['INV-ABC123']);
    expect(paymentReferences('INV-ABC1234')).toEqual([]);
  });
  it.each([{status: 'paid'}, {status: 'expired'}, {provider: 'mock'}, {createdAt: '2026-10-06T12:00:00Z'}, {createdAt: '2026-10-09T11:31:00Z'}])('excludes ineligible orders %s', (patch) => {
    expect(match(event, [{...order, ...patch}]).status).toBe('unmatched');
  });
  it('refuses future event dates', () => { expect(match({...event, receivedAt: '2026-10-09T12:00:01Z'}).status).toBe('unmatched'); });
});
