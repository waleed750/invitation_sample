import {levelForPurchases, pointsForOrder, TIERS} from '@platform/shared';
import type {CommerceState, Invitation} from './types';
import {createShareSlug} from './share';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function emptyCommerceState(): CommerceState {
  return {orders: [], invitations: [], points: {purchaseCount: 0, ledger: []}, checkoutDetails: {}};
}

export function pointsBalance(state: CommerceState, now = new Date()): number {
  return state.points.ledger.reduce((sum, entry) => (
    !entry.expiresAt || new Date(entry.expiresAt) > now ? sum + entry.delta : sum
  ), 0);
}

export function fulfillMockOrder(state: CommerceState, orderId: string, now: Date): CommerceState {
  const orderIndex = state.orders.findIndex((order) => order.id === orderId);
  if (orderIndex === -1) throw new RangeError('Order not found');
  if (state.orders[orderIndex]?.status === 'paid') return state;
  if (state.orders[orderIndex]?.status !== 'pending') throw new RangeError('Only pending orders can be fulfilled');

  const next = structuredClone(state);
  const order = next.orders[orderIndex];
  if (!order) throw new RangeError('Order not found');
  order.status = 'paid';
  order.paidAt = now.toISOString();

  if (order.kind === 'new') {
    const details = next.checkoutDetails?.[order.id] ?? {couple: {first: '', second: ''}, eventDate: now.toISOString()};
    const invitation: Invitation = {
      id: `inv_${order.id}`,
      orderId: order.id,
      templateSlug: order.templateSlug,
      tier: order.tier,
      couple: details.couple,
      eventDate: details.eventDate,
      status: 'draft',
      editsAllowed: TIERS[order.tier].editsAllowed,
      editsUsed: 0,
      shareSlug: createShareSlug(details.couple),
    };
    next.invitations.unshift(invitation);
  } else {
    const invitation = next.invitations.find((item) => item.templateSlug === order.templateSlug && item.tier === order.tier);
    if (invitation && order.kind === 'edits') invitation.editsAllowed += 10;
    if (invitation && order.kind === 'extension') {
      invitation.entitlementNotes = [`+3 months purchased ${now.toISOString()}`, ...(invitation.entitlementNotes ?? [])].slice(0, 20);
    }
  }

  const levelBefore = levelForPurchases(next.points.purchaseCount);
  const earned = pointsForOrder(order.amountEgp, levelBefore);
  if (earned > 0) {
    next.points.ledger.unshift({
      id: `points_${order.id}`,
      delta: earned,
      reason: 'purchase',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + YEAR_MS).toISOString(),
    });
  }
  if (order.pointsRedeemed) {
    next.points.ledger.unshift({
      id: `redeem_${order.id}`,
      delta: -order.pointsRedeemed,
      reason: 'redeem',
      createdAt: now.toISOString(),
    });
  }
  next.points.purchaseCount += 1;
  if (next.checkoutDetails) delete next.checkoutDetails[order.id];
  return next;
}
