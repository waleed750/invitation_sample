import {describe, expect, it} from 'vitest';
import {ApiCommerceClient, ApiError, NotSignedInError, type PaymentStash} from './api';
import type {ManualPayment} from './types';

const ORDER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION = {accessToken: 'tok_secret', userId: 'u1', phone: '+201001234567'};

interface Seen {url: string; method: string; headers: Headers; body: unknown}

function setup(handler: (seen: Seen) => {status?: number; body?: unknown} | Promise<never>, session: typeof SESSION | null = SESSION) {
  const calls: Seen[] = [];
  const stashed = new Map<string, ManualPayment>();
  const stash: PaymentStash = {
    async save(id, payment) { stashed.set(id, payment); },
    async load(id) { return stashed.get(id) ?? null; },
  };
  const fetchFake = (async (input: Request) => {
    const text = await input.clone().text();
    const seen: Seen = {url: input.url, method: input.method, headers: input.headers, body: text ? JSON.parse(text) : undefined};
    calls.push(seen);
    const reply = await handler(seen);
    return new Response(JSON.stringify(reply.body ?? null), {status: reply.status ?? 200, headers: {'content-type': 'application/json'}});
  }) as unknown as typeof fetch;
  const client = new ApiCommerceClient({
    baseUrl: 'https://api.test', fetch: fetchFake, getSession: async () => session, paymentStash: stash, idempotencyKey: () => 'key-12345678',
  });
  return {client, calls, stashed};
}

const payment = {
  reference: 'INV-4821', amountMinor: 129900, currency: 'EGP', expiresAt: '2026-10-11T10:00:00.000Z',
  methods: [{id: 'instapay', label: {ar: 'انستاباي', en: 'InstaPay'}, details: {ar: 'ادفع', en: 'Pay'}}],
};
const apiOrder = {
  id: ORDER_ID, templateId: 't1', tier: 'save-the-date', kind: 'new', amountMinor: 49900, currency: 'EGP', status: 'pending',
  provider: 'manual', reference: 'INV-4821', discountTotalMinor: 5000, pointsRedeemed: 100, createdAt: '2026-10-08T10:00:00.000Z', extra: 'ignored',
};
const checkoutInput = {
  templateSlug: 'classic-gold', tier: 'save-the-date' as const, kind: 'new' as const, method: 'wallet' as const,
  couple: {first: 'A', second: 'B'}, eventDate: '2027-01-15',
};

describe('ApiCommerceClient', () => {
  it('requires API_BASE_URL', () => {
    const previous = process.env.API_BASE_URL;
    delete process.env.API_BASE_URL;
    expect(() => new ApiCommerceClient()).toThrow(/API_BASE_URL/);
    if (previous !== undefined) process.env.API_BASE_URL = previous;
  });

  it('startCheckout posts the body with auth + idempotency headers and maps the manual payment block', async () => {
    const {client, calls, stashed} = setup(() => ({body: {orderId: ORDER_ID, redirectUrl: '/x', reference: 'INV-4821', amountMinor: 129900, currency: 'EGP', payment}}));
    const order = await client.startCheckout(checkoutInput);
    const call = calls[0]!;
    expect(call.method).toBe('POST');
    expect(call.url).toBe('https://api.test/v1/checkout');
    expect(call.headers.get('Authorization')).toBe('Bearer tok_secret');
    expect(call.headers.get('Idempotency-Key')).toBe('key-12345678');
    expect(call.body).toMatchObject({templateSlug: 'classic-gold', tier: 'save-the-date', eventDate: '2027-01-15T12:00:00+02:00', couple: {first: 'A', second: 'B'}});
    expect(order).toMatchObject({id: ORDER_ID, status: 'pending', amountEgp: 1299});
    expect(order.payment?.reference).toBe('INV-4821');
    expect(stashed.get(ORDER_ID)?.reference).toBe('INV-4821');
  });

  it('rejects non-EGP currencies', async () => {
    const {client} = setup(() => ({body: {orderId: ORDER_ID, redirectUrl: '/x', amountMinor: 100, currency: 'USD'}}));
    await expect(client.startCheckout(checkoutInput)).rejects.toThrow(/Unsupported currency/);
  });

  it('getOrder maps an order, merges the stashed payment and returns null on 404', async () => {
    const {client, calls, stashed} = setup((seen) => (seen.url.endsWith(ORDER_ID) ? {body: apiOrder} : {status: 404, body: {error: {code: 'not_found', message: 'x'}}}));
    stashed.set(ORDER_ID, payment);
    const order = await client.getOrder(ORDER_ID);
    expect(calls[0]!.method).toBe('GET');
    expect(calls[0]!.url).toBe(`https://api.test/v1/orders/${ORDER_ID}`);
    expect(order).toMatchObject({amountEgp: 499, discountEgp: 50, tier: 'save-the-date', status: 'pending', pointsRedeemed: 100});
    expect(order?.payment?.methods).toHaveLength(1);
    expect(await client.getOrder('22222222-2222-4222-8222-222222222222')).toBeNull();
  });

  it('falls back to reference and a 72h expiry when nothing is stashed', async () => {
    const {client} = setup(() => ({body: apiOrder}));
    const order = await client.getOrder(ORDER_ID);
    expect(order?.payment).toMatchObject({reference: 'INV-4821', amountMinor: 49900, expiresAt: '2026-10-11T10:00:00.000Z', methods: []});
  });

  it('maps the new expired and rejected statuses and drops payment instructions for them', async () => {
    const {client} = setup(() => ({body: [{...apiOrder, status: 'expired'}, {...apiOrder, id: 'o2', status: 'rejected'}]}));
    const orders = await client.listOrders();
    expect(orders.map((o) => o.status)).toEqual(['expired', 'rejected']);
    expect(orders.every((o) => o.payment === undefined)).toBe(true);
  });

  it('simulatePayment calls the dev endpoint, refuses fawry outcomes and reports a missing endpoint', async () => {
    const ok = setup((seen) => (seen.method === 'POST' ? {body: {ok: true}} : {body: {...apiOrder, status: 'paid'}}));
    const paid = await ok.client.simulatePayment(ORDER_ID, 'succeed');
    expect(ok.calls[0]!.url).toBe(`https://api.test/v1/dev/payments/mock/${ORDER_ID}/succeed`);
    expect(paid.status).toBe('paid');
    await expect(ok.client.simulatePayment(ORDER_ID, 'fawry_paid')).rejects.toMatchObject({code: 'unsupported'});
    const missing = setup(() => ({status: 404, body: {error: {code: 'not_found'}}}));
    await expect(missing.client.simulatePayment(ORDER_ID, 'fail')).rejects.toMatchObject({code: 'mock_payments_unavailable'});
  });

  it('lists and gets invitations, merging template slug from the list', async () => {
    const summary = {
      id: 'i1', orderId: ORDER_ID, templateSlug: 'classic-gold', tier: 'classic', shareSlug: 'a-b-1234', data: {event_date: '2027-01-15T12:00:00+02:00', couple: {first: 'A', second: 'B'}},
      locale: 'ar', status: 'draft', createdAt: '2026-10-08T10:00:00Z', entitlement: {editsAllowed: 15, editsUsed: 1, remaining: 14, onlineUntil: null, daysOnlineLeft: 0, canPublish: {ok: true}},
    };
    const detail = {id: 'i1', slug: 'a-b-1234', status: 'published', templateId: 't1', data: {couple: {firstName: {ar: 'أ', en: 'A'}, secondName: {ar: 'ب', en: 'B'}}, event: {date: {ar: '2027-01-15', en: '2027-01-15'}}},
      updatedAt: 'u', publishedAt: '2026-10-09T00:00:00Z', entitlement: {...summary.entitlement, tier: 'classic', onlineUntil: '2027-04-01T00:00:00Z'}};
    const {client, calls} = setup((seen) => (seen.url.endsWith('/v1/invitations') ? {body: [summary]} : {body: detail}));
    const list = await client.listInvitations();
    expect(list[0]).toMatchObject({id: 'i1', tier: 'classic', couple: {first: 'A', second: 'B'}, eventDate: '2027-01-15', status: 'draft', editsAllowed: 15, orderId: ORDER_ID});
    const one = await client.getInvitation('i1');
    expect(calls.some((c) => c.url === 'https://api.test/v1/invitations/i1')).toBe(true);
    expect(one).toMatchObject({templateSlug: 'classic-gold', status: 'published', firstPublishedAt: '2026-10-09T00:00:00Z', onlineUntil: '2027-04-01T00:00:00Z', couple: {first: 'أ', second: 'ب'}});
  });

  it('publishInvitation maps ok:false reasons and 404', async () => {
    const reason = setup(() => ({body: {ok: false, reason: 'no_edits_left'}}));
    expect(await reason.client.publishInvitation('i1')).toEqual({ok: false, reason: 'no_edits_left'});
    expect(reason.calls[0]!.method).toBe('POST');
    expect(reason.calls[0]!.url).toBe('https://api.test/v1/invitations/i1/publish');
    const missing = setup(() => ({status: 404, body: {error: {code: 'not_found'}}}));
    expect(await missing.client.publishInvitation('i1')).toEqual({ok: false, reason: 'not_found'});
  });

  it('getPoints maps balance, level and ledger', async () => {
    const {client} = setup(() => ({body: {balance: 250, purchaseCount: 2, level: 'x', ledger: [{id: 'l1', orderId: null, delta: 100, reason: 'purchase', createdAt: 'c', expiresAt: null}]}}));
    const points = await client.getPoints();
    expect(points.balance).toBe(250);
    expect(points.ledger).toEqual([{id: 'l1', delta: 100, reason: 'purchase', createdAt: 'c'}]);
    expect(points.level).toBeTruthy();
  });

  it('getSession combines the auth session with the profile locale', async () => {
    const {client} = setup(() => ({body: {id: 'u1', preferred_locale: 'en'}}));
    expect(await client.getSession()).toEqual({phone: '+201001234567', locale: 'en'});
    expect(await setup(() => ({body: null}), null).client.getSession()).toBeNull();
  });

  it('sendOtp and verifyOtp are unsupported; signOut is a no-op', async () => {
    const {client} = setup(() => ({body: null}));
    await expect(client.sendOtp()).rejects.toThrow(/Better Auth/);
    await expect(client.verifyOtp()).rejects.toThrow(/Better Auth/);
    await expect(client.signOut()).resolves.toBeUndefined();
  });

  it('throws NotSignedInError without a session or on 401, without calling the API when signed out', async () => {
    const out = setup(() => ({body: []}), null);
    await expect(out.client.listOrders()).rejects.toBeInstanceOf(NotSignedInError);
    expect(out.calls).toHaveLength(0);
    const unauthorized = setup(() => ({status: 401, body: {error: {code: 'unauthorized', message: 'no'}}}));
    await expect(unauthorized.client.listOrders()).rejects.toBeInstanceOf(NotSignedInError);
  });

  it('maps 4xx envelopes, 5xx and network failures to ApiError', async () => {
    const unprocessable = setup(() => ({status: 422, body: {error: {code: 'price_not_found', message: 'No price'}}}));
    await expect(unprocessable.client.startCheckout(checkoutInput)).rejects.toMatchObject({name: 'ApiError', code: 'price_not_found', status: 422});
    const down = setup(() => ({status: 503, body: {error: {code: 'service_unavailable', message: 'x'}}}));
    await expect(down.client.listOrders()).rejects.toMatchObject({code: 'unavailable', status: 503});
    const network = setup(() => Promise.reject(new Error('ECONNREFUSED tok_secret')));
    const failure = await network.client.listOrders().catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe('unavailable');
    expect((failure as ApiError).message).not.toContain('tok_secret');
  });

  it('flags response drift with bad_response', async () => {
    const {client} = setup(() => ({body: [{id: 'x'}]}));
    await expect(client.listOrders()).rejects.toMatchObject({code: 'bad_response'});
  });
});
