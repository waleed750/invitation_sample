import {cookies} from 'next/headers';
import {levelForPurchases, TIER_ORDER} from '@platform/shared';
import {fulfillMockOrder, emptyCommerceState, pointsBalance} from './fulfill';
import {normalizeEgyptPhone} from './phone';
import {quote} from './pricing';
import {legacyShareSlug} from './share';
import {publishInvitationRecord} from './publish';
import type {CommerceClient, CommerceState, Invitation, Order, PublishInvitationResult, StartCheckoutInput} from './types';

const COOKIE_NAME = 'inv_demo';
const MAX_ITEMS = 20;

function decodeState(value?: string): CommerceState {
  if (!value) return emptyCommerceState();
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as CommerceState;
    if (!Array.isArray(parsed.orders) || !Array.isArray(parsed.invitations) || !Array.isArray(parsed.points?.ledger)) {
      return emptyCommerceState();
    }
    parsed.invitations = parsed.invitations.map((invitation) => ({
      ...invitation,
      shareSlug: invitation.shareSlug || legacyShareSlug(invitation.id),
    }));
    return parsed;
  } catch {
    return emptyCommerceState();
  }
}

function compactState(state: CommerceState): CommerceState {
  state.orders = state.orders.slice(0, MAX_ITEMS);
  state.invitations = state.invitations.slice(0, MAX_ITEMS);
  state.points.ledger = state.points.ledger.slice(0, MAX_ITEMS);
  const retainedIds = new Set(state.orders.map((order) => order.id));
  if (state.checkoutDetails) {
    state.checkoutDetails = Object.fromEntries(
      Object.entries(state.checkoutDetails).filter(([id]) => retainedIds.has(id)).slice(0, MAX_ITEMS),
    );
  }
  return state;
}

async function readState(): Promise<CommerceState> {
  return decodeState((await cookies()).get(COOKIE_NAME)?.value);
}

async function writeState(state: CommerceState): Promise<void> {
  const value = Buffer.from(JSON.stringify(compactState(state)), 'utf8').toString('base64url');
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

export class MockCommerceClient implements CommerceClient {
  async getSession() {
    return (await readState()).session ?? null;
  }

  async signOut(): Promise<void> {
    const state = await readState();
    delete state.session;
    await writeState(state);
  }

  async sendOtp(phone: string): Promise<{ok: true}> {
    if (!normalizeEgyptPhone(phone)) throw new RangeError('invalid_phone');
    return {ok: true};
  }

  async verifyOtp(phone: string, code: string, locale = 'ar') {
    const normalized = normalizeEgyptPhone(phone);
    if (!normalized) throw new RangeError('invalid_phone');
    if (code !== '123456') throw new RangeError('invalid_code');
    const state = await readState();
    state.session = {phone: normalized, locale};
    await writeState(state);
    return state.session;
  }

  async startCheckout(input: StartCheckoutInput): Promise<Order> {
    const state = await readState();
    if (!state.session) throw new RangeError('phone_not_verified');
    if (!TIER_ORDER.includes(input.tier)) throw new RangeError('invalid_tier');
    const balance = pointsBalance(state);
    const serverQuote = quote({...input, balance});
    const now = new Date();
    const order: Order = {
      id: makeId('ord'),
      templateSlug: input.templateSlug,
      tier: input.tier,
      kind: input.kind,
      method: input.method,
      status: 'pending',
      amountEgp: serverQuote.total,
      discountEgp: serverQuote.discount,
      couponCode: input.couponCode?.trim().toUpperCase() || undefined,
      createdAt: now.toISOString(),
    };
    state.orders.unshift(order);
    state.checkoutDetails ??= {};
    state.checkoutDetails[order.id] = {couple: input.couple, eventDate: input.eventDate};
    await writeState(state);
    return order;
  }

  async getOrder(id: string): Promise<Order | null> {
    return (await readState()).orders.find((order) => order.id === id) ?? null;
  }

  async simulatePayment(orderId: string, outcome: 'succeed' | 'fail' | 'fawry_reference' | 'fawry_paid'): Promise<Order> {
    let state = await readState();
    const index = state.orders.findIndex((order) => order.id === orderId);
    const order = state.orders[index];
    if (!order) throw new RangeError('order_not_found');
    if (order.status === 'paid') return order;
    if (order.status === 'failed' && (outcome === 'succeed' || outcome === 'fawry_reference')) order.status = 'pending';
    if (outcome === 'fail') order.status = 'failed';
    if (outcome === 'fawry_reference') {
      order.status = 'pending';
      order.fawryReference ??= String(Math.floor(100_000_000 + Math.random() * 900_000_000));
    }
    if (outcome === 'succeed' || outcome === 'fawry_paid') state = fulfillMockOrder(state, orderId, new Date());
    await writeState(state);
    const updated = state.orders.find((item) => item.id === orderId);
    if (!updated) throw new RangeError('order_not_found');
    return updated;
  }

  async listInvitations(): Promise<Invitation[]> {
    return (await readState()).invitations;
  }

  async getInvitation(id: string): Promise<Invitation | null> {
    return (await readState()).invitations.find((invitation) => invitation.id === id) ?? null;
  }

  async publishInvitation(id: string): Promise<PublishInvitationResult> {
    return publishInvitation(id, new Date());
  }

  async listOrders(): Promise<Order[]> {
    return (await readState()).orders;
  }

  async getPoints() {
    const state = await readState();
    return {
      balance: pointsBalance(state),
      purchaseCount: state.points.purchaseCount,
      level: levelForPurchases(state.points.purchaseCount),
      ledger: state.points.ledger,
    };
  }
}

export async function publishInvitation(
  id: string,
  now: Date,
): Promise<PublishInvitationResult> {
  const state = await readState();
  const index = state.invitations.findIndex((item) => item.id === id);
  const result = publishInvitationRecord(state.invitations[index], now);
  if (!result.ok) return result;
  state.invitations[index] = result.invitation;
  await writeState(state);
  return result;
}
