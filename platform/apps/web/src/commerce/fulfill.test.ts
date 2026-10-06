import {describe, expect, it} from 'vitest';
import {fulfillMockOrder} from './fulfill';
import type {CommerceState, Order} from './types';

const now = new Date('2026-10-06T10:00:00.000Z');
function stateWith(order: Order, purchaseCount = 0): CommerceState {
  return {
    orders: [order], invitations: [], points: {purchaseCount, ledger: []},
    checkoutDetails: {[order.id]: {couple: {first: 'نور', second: 'عمر'}, eventDate: '2027-01-01T00:00:00.000Z'}},
  };
}
function pending(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order_1', templateSlug: 'mashrabiya', tier: 'classic', kind: 'new', method: 'card',
    status: 'pending', amountEgp: 1299, discountEgp: 0, createdAt: now.toISOString(), ...overrides,
  };
}

describe('fulfillMockOrder', () => {
  it('creates a draft with tier edits and no online deadline', () => {
    const result = fulfillMockOrder(stateWith(pending()), 'order_1', now);
    expect(result.orders[0]).toMatchObject({status: 'paid', paidAt: now.toISOString()});
    expect(result.invitations[0]).toMatchObject({status: 'draft', editsAllowed: 15, editsUsed: 0});
    expect(result.invitations[0]?.shareSlug).toMatch(/^invite-[a-z0-9]{6}$/);
    expect(result.invitations[0]?.onlineUntil).toBeUndefined();
    expect(result.points).toMatchObject({purchaseCount: 1, ledger: [{delta: 129, reason: 'purchase'}]});
  });

  it('is idempotent for a paid order', () => {
    const once = fulfillMockOrder(stateWith(pending()), 'order_1', now);
    expect(fulfillMockOrder(once, 'order_1', new Date('2026-10-07T10:00:00Z'))).toBe(once);
  });

  it('uses the pre-order loyalty level for points', () => {
    expect(fulfillMockOrder(stateWith(pending({amountEgp: 1000}), 2), 'order_1', now).points.ledger[0]?.delta).toBe(110);
    expect(fulfillMockOrder(stateWith(pending({amountEgp: 1000}), 4), 'order_1', now).points.ledger[0]?.delta).toBe(125);
  });

  it('adds ten edits and records extension purchases', () => {
    const invitation = {
      id: 'inv_old', orderId: 'old', templateSlug: 'mashrabiya', tier: 'classic' as const,
      couple: {first: 'A', second: 'B'}, eventDate: now.toISOString(), status: 'draft' as const,
      editsAllowed: 15, editsUsed: 0,
      shareSlug: 'a-b',
    };
    const editsState = stateWith(pending({kind: 'edits', amountEgp: 99}));
    editsState.invitations = [invitation];
    expect(fulfillMockOrder(editsState, 'order_1', now).invitations[0]?.editsAllowed).toBe(25);

    const extensionState = stateWith(pending({kind: 'extension', amountEgp: 199}));
    extensionState.invitations = [invitation];
    expect(fulfillMockOrder(extensionState, 'order_1', now).invitations[0]?.entitlementNotes?.[0]).toContain('+3 months');
  });
});
