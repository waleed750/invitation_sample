/* eslint-disable */
import {BadRequestException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {PAYMENT_PROVIDER} from '../payments/payment-provider';
import {SupabaseService} from '../supabase/supabase.service';
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
        {provide: SupabaseService, useValue: supabaseClient},
        {provide: PAYMENT_PROVIDER, useValue: provider},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(CheckoutService);
  });

  it('should start checkout successfully', async () => {
    // 1. existingOrder (maybeSingle)
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: null, error: null});
    // 2. template (single)
    queryBuilder.single.mockResolvedValueOnce({
      data: {id: 't1', slug: 't1', name: {en: 'T1'}, tagline: {en: 't1'}, tier: 'classic', price_override_egp: null, status: 'live', featured: false},
      error: null
    });
    // 3. pointsBalance (single)
    queryBuilder.single.mockResolvedValueOnce({data: {points_balance: 0}, error: null});
    // 4. rpc
    supabaseClient.rpc.mockResolvedValueOnce({data: {order_id: 'new_order', amount_egp: 500}, error: null});

    const user = {id: 'u1', jwt: 't1'} as any;
    const body = {
      templateSlug: 't1', tier: 'classic', kind: 'new', method: 'card', couple: {first: 'A', second: 'B'}, eventDate: '2026-06-20T00:00:00Z'
    } as any;

    const result = await service.start(user, body, 'idemp-1234');
    expect(result.orderId).toBe('new_order');
    expect(result.redirectUrl).toBe('url');
    expect(supabaseClient.rpc).toHaveBeenCalledWith('create_pending_checkout', expect.any(Object));
    expect(provider.createCheckout).toHaveBeenCalledWith({id: 'new_order', amountEgp: 500, method: 'card'});
  });

  it('should return existing order if idempotency key matches', async () => {
    // 1. existingOrder (maybeSingle)
    queryBuilder.maybeSingle.mockResolvedValueOnce({data: {id: 'old_order', amount_egp: 500}, error: null});
    
    const user = {id: 'u1', jwt: 't1'} as any;
    const body = {
      templateSlug: 't1', tier: 'classic', kind: 'new', method: 'card', couple: {first: 'A', second: 'B'}, eventDate: '2026-06-20T00:00:00Z'
    } as any;

    const result = await service.start(user, body, 'idemp-1234');
    expect(result.orderId).toBe('old_order');
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
  });
});
