import {CheckoutRepository} from './checkout.repository';
import type {SupabaseService} from '../supabase/supabase.service';

describe('CheckoutRepository', () => {
  it('maps createPendingCheckoutAsServiceRole input to the RPC parameter names on the service-role client', async () => {
    const rpc = jest.fn().mockResolvedValue({data: null, error: null});
    const admin = jest.fn().mockReturnValue({rpc});
    const forUser = jest.fn();
    const publicClient = jest.fn();
    const repo = new CheckoutRepository({admin, forUser, public: publicClient} as unknown as SupabaseService);

    await repo.createPendingCheckoutAsServiceRole({
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

    expect(admin).toHaveBeenCalledTimes(1);
    expect(forUser).not.toHaveBeenCalled();
    expect(publicClient).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith('create_pending_checkout', {
      p_order_id: 'o1',
      p_user_id: 'u1',
      p_template_id: 't1',
      p_tier: 'save_the_date',
      p_kind: 'new',
      p_amount_minor: 50000,
      p_currency: 'EGP',
      p_provider: 'mock',
      p_idempotency_key: null,
      p_coupon_code: 'save10',
      p_discount_total_minor: 5000,
      p_points_redeemed: 100,
      p_invitation_slug: 'a-b-o1',
      p_invitation_data: {couple: {first: 'A', second: 'B'}}
    });
  });
});
