import type {ParsedEvent} from './payment-event-provider';

export interface PaymentCandidate {
  id: string;
  reference: string | null;
  amountMinor: number;
  extraMinor: number | null;
  currency: string;
  createdAt: string;
  status: string;
  provider: string;
}
export type MatchResult =
  | {status: 'matched'; orderId: string; reason: 'reference' | 'unique_amount'}
  | {status: 'unmatched' | 'ambiguous'; reason: string};
const WINDOW_MS = 72 * 60 * 60 * 1000;

export function paymentReferences(text: string): string[] {
  const matches = text.matchAll(/\bINV[\s-]*((?:[A-Z0-9][\s-]*){5}[A-Z0-9])(?![A-Z0-9])/gi);
  return [...new Set(Array.from(matches, (m) => `INV-${m[1].replace(/[\s-]/g, '').toUpperCase()}`))];
}

/** Pure: caller supplies time, event and snapshot. SQL rechecks before writing. */
export function matchPaymentEvent(event: ParsedEvent, orders: PaymentCandidate[], now: number): MatchResult {
  const received = Date.parse(event.receivedAt);
  const active = orders.filter((order) => {
    const created = Date.parse(order.createdAt);
    return order.provider === 'manual' && order.status === 'pending' &&
      created <= received && received <= now && received < created + WINDOW_MS && now < created + WINDOW_MS;
  });
  const exact = (order: PaymentCandidate): boolean => order.currency === event.currency &&
    order.amountMinor + (order.extraMinor ?? 0) === event.amountMinor;
  const references = paymentReferences(event.referenceText ?? '');
  if (references.length > 1) return {status: 'ambiguous', reason: 'multiple_references'};
  if (references.length === 1) {
    const candidates = active.filter((order) => order.reference !== null && references.includes(order.reference.toUpperCase()));
    if (candidates.length > 1) return {status: 'ambiguous', reason: 'multiple_references'};
    const order = candidates.at(0);
    if (order === undefined) return {status: 'unmatched', reason: 'reference_not_found'};
    if (!exact(order)) return {status: 'unmatched', reason: 'amount_mismatch'};
    return {status: 'matched', orderId: order.id, reason: 'reference'};
  }
  const candidates = active.filter(exact);
  if (candidates.length > 1) return {status: 'ambiguous', reason: 'multiple_amount_matches'};
  const order = candidates.at(0);
  if (order === undefined) return {status: 'unmatched', reason: 'no_match'};
  return {status: 'matched', orderId: order.id, reason: 'unique_amount'};
}
