import {CheckoutRepository} from './checkout.repository';
import {createFakeDb} from '../testing/fake-db';

describe('CheckoutRepository', () => {
  it('maps createPendingCheckoutAsServiceRole input to the RPC positional parameters on the service role', async () => {
    const {db, queries} = createFakeDb([[{result: {order_id: 'o1', amount_minor: 50000, currency: 'EGP'}}]]);
    const repo = new CheckoutRepository(db);

    const result = await repo.createPendingCheckoutAsServiceRole({
      orderId: 'o1',
      userId: 'u1',
      templateId: 't1',
      tier: 'save_the_date',
      kind: 'new',
      amountMinor: 50000,
      currency: 'EGP',
      provider: 'mock',
      idempotencyKey: null,
      couponCode: 'save10',
      discountTotalMinor: 5000,
      pointsRedeemed: 100,
      invitationSlug: 'a-b-o1',
      invitationData: {couple: {first: 'A', second: 'B'}}
    });

    expect(result).toEqual({order_id: 'o1', amount_minor: 50000, currency: 'EGP'});
    expect(queries).toHaveLength(1);
    expect(queries[0]?.role).toBe('service_role');
    expect(queries[0]?.text).toContain('public.create_pending_checkout');
    // Positional bind parameters keep the RPC argument order; jsonb travels as a stringified bind value.
    expect(queries[0]?.params).toEqual([
      'o1', 'u1', 't1', 'save_the_date', 'new', 50000, 'EGP', 'mock',
      null, 'save10', 5000, 100, 'a-b-o1',
      JSON.stringify({couple: {first: 'A', second: 'B'}})
    ]);
  });

  it('returns null when the RPC returns SQL null', async () => {
    const {db} = createFakeDb([[{result: null}]]);
    const repo = new CheckoutRepository(db);
    await expect(repo.createPendingCheckoutAsServiceRole({
      orderId: 'o1', userId: 'u1', templateId: 't1', tier: 'save_the_date', kind: 'new',
      amountMinor: 50000, currency: 'EGP', provider: 'mock', idempotencyKey: null,
      couponCode: null, discountTotalMinor: 0, pointsRedeemed: 0,
      invitationSlug: 'a-b-o1', invitationData: {}
    })).resolves.toBeNull();
  });

  it('reads the points balance as the caller (authenticated role)', async () => {
    const {db, queries} = createFakeDb([[{r: {points_balance: 80}}]]);
    const repo = new CheckoutRepository(db);
    await expect(repo.findPointsBalance('u1')).resolves.toEqual({points_balance: 80});
    expect(queries[0]?.role).toBe('authenticated');
    expect(queries[0]?.userId).toBe('u1');
  });
});
