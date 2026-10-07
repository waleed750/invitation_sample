/* eslint-disable */
import {ConflictException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {SupabaseService} from '../supabase/supabase.service';
import {PaymentsRepository} from './payments.repository';
import {MockPaymentProvider} from './mock-payment.provider';
import {PAYMENT_PROVIDER} from './payment-provider';
import {PaymentsService} from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let supabaseClient: any;
  let provider: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({data: null, error: null})) // For await .eq()
    };

    supabaseClient = {
      from: jest.fn().mockReturnValue(queryBuilder),
      rpc: jest.fn()
    };

    provider = {
      verifyWebhook: jest.fn()
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {provide: PAYMENT_PROVIDER, useValue: provider},
        {provide: MockPaymentProvider, useValue: {sign: jest.fn().mockReturnValue('signature')}},
        PaymentsRepository, {provide: SupabaseService, useValue: {admin: () => supabaseClient}},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(PaymentsService);
  });

  it('should handle successful webhook', async () => {
    provider.verifyWebhook.mockResolvedValueOnce({providerRef: 'ref_1', status: 'paid', amountEgp: 100});
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 100, status: 'pending'}, error: null});
    supabaseClient.rpc.mockResolvedValueOnce({data: null, error: null});

    const result = await service.handleWebhook('mock', Buffer.from(''), {});
    expect(result).toEqual({ok: true});
    expect(supabaseClient.rpc).toHaveBeenCalledWith('fulfill_paid_order', {p_order_id: 'order_1'});
  });

  it('should handle failed webhook', async () => {
    provider.verifyWebhook.mockResolvedValueOnce({providerRef: 'ref_1', status: 'failed', amountEgp: 100});
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 100, status: 'pending'}, error: null});
    // queryBuilder is thenable, resolves to {data: null, error: null}

    const result = await service.handleWebhook('mock', Buffer.from(''), {});
    expect(result).toEqual({ok: true});
    expect(queryBuilder.update).toHaveBeenCalled();
  });

  it('should reject unknown provider', async () => {
    await expect(service.handleWebhook('unknown', Buffer.from(''), {})).rejects.toThrow(NotFoundException);
  });

  it('should reject amount mismatch', async () => {
    provider.verifyWebhook.mockResolvedValueOnce({providerRef: 'ref_1', status: 'paid', amountEgp: 100});
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 50, status: 'pending'}, error: null});

    await expect(service.handleWebhook('mock', Buffer.from(''), {})).rejects.toThrow(ConflictException);
  });

  it('should gracefully handle already fulfilled order', async () => {
    provider.verifyWebhook.mockResolvedValueOnce({providerRef: 'ref_1', status: 'paid', amountEgp: 100});
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 100, status: 'paid'}, error: null});

    const result = await service.handleWebhook('mock', Buffer.from(''), {});
    expect(result).toEqual({ok: true});
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
    expect(queryBuilder.update).not.toHaveBeenCalled();
  });

  it('should simulate webhook internally', async () => {
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 100, status: 'pending', user_id: 'user_1'}, error: null}); // findOrderById
    provider.verifyWebhook.mockResolvedValueOnce({providerRef: 'mock_order_1', status: 'paid', amountEgp: 100});
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 100, status: 'pending'}, error: null}); // findOrder
    supabaseClient.rpc.mockResolvedValueOnce({data: null, error: null});

    const result = await service.simulate('order_1', 'paid', 'user_1');
    expect(result).toEqual({ok: true});
  });

  it('should not let a user settle someone else\'s order via the dev shortcut', async () => {
    queryBuilder.single.mockResolvedValueOnce({data: {id: 'order_1', amount_egp: 100, status: 'pending', user_id: 'someone_else'}, error: null});

    await expect(service.simulate('order_1', 'paid', 'user_1')).rejects.toThrow(NotFoundException);
    expect(supabaseClient.rpc).not.toHaveBeenCalled();
  });
});
