/* eslint-disable */
import {BadRequestException, ServiceUnavailableException, UnprocessableEntityException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {PAYMENT_PROVIDER} from '../payments/payment-provider';
import {SupabaseService} from '../supabase/supabase.service';
import {CheckoutRepository} from './checkout.repository';
import {CheckoutService} from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let supabaseClient: any;
  let provider: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      update: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({data: null, error: null}))
    };

    supabaseClient = {
      public: () => supabaseClient,
      forUser: () => supabaseClient,
      admin: () => supabaseClient,
      from: jest.fn().mockReturnValue(queryBuilder),
      rpc: jest.fn()
    };
    
    provider = {
      createCheckout: jest.fn().mockResolvedValue({redirectUrl: 'url', providerRef: 'ref', reference: 'mock-ref'})
    };
    
    const module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        CheckoutRepository, {provide: SupabaseService, useValue: supabaseClient},
        {provide: PAYMENT_PROVIDER, useValue: provider},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(CheckoutService);
  });

  const user = {id: 'u1', jwt: 't1'} as any;
  const body = (extra: object = {}) => ({
    templateSlug: 't1', tier: 'classic', kind: 'new', method: 'card', couple: {first: 'A', second: 'B'}, eventDate: '2026-06-20T00:00:00Z', ...extra
  }) as any;

  /** Mocks existing-order lookup, template, points balance; prices are mocked per test. */
  function mockHappyPrefix(balance = 0) {
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: null, error: null}); // existingOrder
    queryBuilder.single.mockResolvedValueOnce({
      data: {id: 't1', slug: 't1', name: {en: 'T1'}, tagline: {en: 't1'}, tier: 'classic', status: 'live', featured: false},
      error: null
    });
    queryBuilder.single.mockResolvedValueOnce({data: {points_balance: balance}, error: null});
  }

  function rpcArgs(): any {
    return supabaseClient.rpc.mock.calls[0][1];
  }

  it('should start checkout successfully', async () => {
    mockHappyPrefix();
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {amount_minor: 50000}, error: null}); // template price
    supabaseClient.rpc.mockResolvedValueOnce({data: {order_id: 'new_order', amount_minor: 50000, currency: 'EGP'}, error: null});

    const result = await service.start(user, body(), 'idemp-1234');
    expect(result).toMatchObject({orderId: 'new_order', redirectUrl: 'url', amountMinor: 50000, currency: 'EGP'});
    expect(supabaseClient.rpc).toHaveBeenCalledWith('create_pending_checkout', expect.any(Object));
    expect(provider.createCheckout).toHaveBeenCalledWith({id: 'new_order', amountMinor: 50000, currency: 'EGP', method: 'card'});
  });

  it('uses the template-specific price when one exists (override wins)', async () => {
    mockHappyPrefix();
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {amount_minor: 99900}, error: null}); // template price
    supabaseClient.rpc.mockResolvedValueOnce({data: {order_id: 'o', amount_minor: 99900, currency: 'EGP'}, error: null});

    await service.start(user, body(), 'idemp-1234');
    expect(rpcArgs()).toMatchObject({p_amount_minor: 99900, p_currency: 'EGP', p_discount_total_minor: 0, p_tier: 'classic'});
    expect(queryBuilder.is).not.toHaveBeenCalled(); // tier default never consulted
    expect(queryBuilder.eq).toHaveBeenCalledWith('template_id', 't1');
  });

  it('falls back to the tier default price when the template has no specific row', async () => {
    mockHappyPrefix();
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: null, error: null}); // no template price
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {amount_minor: 129900}, error: null}); // tier default
    supabaseClient.rpc.mockResolvedValueOnce({data: {order_id: 'o', amount_minor: 129900, currency: 'EGP'}, error: null});

    await service.start(user, body(), 'idemp-1234');
    expect(rpcArgs()).toMatchObject({p_amount_minor: 129900, p_currency: 'EGP'});
    expect(queryBuilder.is).toHaveBeenCalledWith('template_id', null);
  });

  it('fails with price_not_found when neither a template nor a tier price exists', async () => {
    mockHappyPrefix();
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: null, error: null});
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: null, error: null});

    const error: any = await service.start(user, body(), 'idemp-1234').catch(e => e);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(error.getResponse()).toMatchObject({code: 'price_not_found'});
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });

  it('keeps every amount an integer when a percent coupon is applied', async () => {
    mockHappyPrefix();
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {amount_minor: 129900}, error: null});
    queryBuilder.single.mockResolvedValueOnce({
      data: {percent_off: 7.1, amount_off_minor: null, currency: 'EGP', max_uses: null, used_count: 0, expires_at: null, active: true},
      error: null
    });
    supabaseClient.rpc.mockResolvedValueOnce({data: {order_id: 'o', amount_minor: 120677, currency: 'EGP'}, error: null});

    await service.start(user, body({couponCode: 'SAVE'}), 'idemp-1234');
    const args = rpcArgs();
    // floor(129900 * 7.1 / 100) = 9222 minor units off (cap is 30% = 38970).
    expect(args.p_discount_total_minor).toBe(9222);
    expect(args.p_amount_minor).toBe(129900 - 9222);
    expect(Number.isInteger(args.p_amount_minor)).toBe(true);
    expect(Number.isInteger(args.p_discount_total_minor)).toBe(true);
  });

  it('rejects a fixed-amount coupon in a different currency', async () => {
    mockHappyPrefix();
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {amount_minor: 129900}, error: null});
    queryBuilder.single.mockResolvedValueOnce({
      data: {percent_off: null, amount_off_minor: 1000, currency: 'USD', max_uses: null, used_count: 0, expires_at: null, active: true},
      error: null
    });

    await expect(service.start(user, body({couponCode: 'usd'}), 'idemp-1234')).rejects.toThrow(BadRequestException);
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
  });

  it('uses the fixed minor-unit prices for edits packs without a price lookup', async () => {
    mockHappyPrefix();
    supabaseClient.rpc.mockResolvedValueOnce({data: {order_id: 'o', amount_minor: 9900, currency: 'EGP'}, error: null});

    await service.start(user, body({kind: 'edits'}), 'idemp-1234');
    expect(rpcArgs()).toMatchObject({p_amount_minor: 9900, p_currency: 'EGP'});
    expect(queryBuilder.maybeSingle).toHaveBeenCalledTimes(1); // only the idempotency lookup
  });

  it('should return existing order if idempotency key matches', async () => {
    // 1. existingOrder (maybeSingle)
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {id: 'old_order', amount_minor: 50000, currency: 'EGP'}, error: null});
    
    const user = {id: 'u1', jwt: 't1'} as any;
    const body = {
      templateSlug: 't1', tier: 'classic', kind: 'new', method: 'card', couple: {first: 'A', second: 'B'}, eventDate: '2026-06-20T00:00:00Z'
    } as any;

    const result = await service.start(user, body, 'idemp-1234');
    expect(result.orderId).toBe('old_order');
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
  });
});
