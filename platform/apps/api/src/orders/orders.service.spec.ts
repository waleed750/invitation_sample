/* eslint-disable */
import {NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {SupabaseService} from '../supabase/supabase.service';
import {OrdersRepository} from './orders.repository';
import {OrdersService} from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let supabaseClient: any;

  beforeEach(async () => {
    supabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrdersRepository, {provide: SupabaseService, useValue: {forUser: () => supabaseClient}},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(OrdersService);
  });

  const validOrder = {
    id: '1', template_id: 't1', tier: 'classic', kind: 'new', amount_egp: 100,
    status: 'paid', provider: 'mock', provider_ref: 'mock_1',
    discount_total: 0, points_redeemed: 0, created_at: '2026-01-01T00:00:00Z', paid_at: '2026-01-01T00:01:00Z'
  };

  it('should list orders', async () => {
    supabaseClient.order.mockResolvedValueOnce({data: [validOrder], error: null});
    const result = await service.list({id: 'u1', jwt: 't1'} as any);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should get an order', async () => {
    supabaseClient.single.mockResolvedValueOnce({data: validOrder, error: null});
    const result = await service.get({id: 'u1', jwt: 't1'} as any, '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException on PGRST116', async () => {
    supabaseClient.single.mockResolvedValueOnce({data: null, error: {code: 'PGRST116'}});
    await expect(service.get({id: 'u1', jwt: 't1'} as any, '1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ServiceUnavailableException on generic DB error', async () => {
    supabaseClient.single.mockResolvedValueOnce({data: null, error: new Error('DB error')});
    await expect(service.get({id: 'u1', jwt: 't1'} as any, '1')).rejects.toThrow(ServiceUnavailableException);
  });
});
