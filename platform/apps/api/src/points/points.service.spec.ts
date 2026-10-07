/* eslint-disable */
import {ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {SupabaseService} from '../supabase/supabase.service';
import {PointsRepository} from './points.repository';
import {PointsService} from './points.service';

describe('PointsService', () => {
  let service: PointsService;
  let supabaseClient: any;

  beforeEach(async () => {
    supabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    const module = await Test.createTestingModule({
      providers: [
        PointsService,
        PointsRepository, {provide: SupabaseService, useValue: {forUser: () => supabaseClient}},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(PointsService);
  });

  it('should get points balance and ledger', async () => {
    // Mock the profile result
    supabaseClient.single.mockResolvedValueOnce({
      data: {points_balance: 150, purchases_count: 5},
      error: null
    });
    // Mock the ledger result
    supabaseClient.limit.mockResolvedValueOnce({
      data: [{
        id: '1', order_id: null, delta: 100, reason: 'welcome',
        created_at: '2026-01-01T00:00:00Z', expires_at: null
      }],
      error: null
    });

    const result = await service.get({id: 'u1', jwt: 't1'} as any);
    expect(result.balance).toBe(150);
    expect(result.purchaseCount).toBe(5);
    expect(result.level).toBeDefined();
    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0].delta).toBe(100);
  });

  it('should throw ServiceUnavailableException on DB error', async () => {
    supabaseClient.single.mockResolvedValueOnce({data: null, error: new Error('DB Error')});
    await expect(service.get({id: 'u1', jwt: 't1'} as any)).rejects.toThrow(ServiceUnavailableException);
  });
});
