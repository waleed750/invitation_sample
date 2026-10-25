/* eslint-disable */
import {ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {PointsRepository} from './points.repository';
import {PointsService} from './points.service';

describe('PointsService', () => {
  let service: PointsService;
  let repository: {findBalance: jest.Mock; listLedger: jest.Mock; expiringSoon: jest.Mock; referral: jest.Mock; spendable: jest.Mock};

  beforeEach(async () => {
    repository = {
      findBalance: jest.fn(), listLedger: jest.fn(),
      expiringSoon: jest.fn().mockResolvedValue({points: 40, first_expiry: '2026-11-03T00:00:00Z', days: 30}),
      referral: jest.fn().mockResolvedValue({code: 'f-abcd2345', summary: {invited: 3, rewarded: 1, reward_points: 100}}),
      spendable: jest.fn().mockResolvedValue(120)
    };

    const module = await Test.createTestingModule({
      providers: [
        PointsService,
        {provide: PointsRepository, useValue: repository},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(PointsService);
  });

  it('should get points balance and ledger', async () => {
    repository.findBalance.mockResolvedValueOnce({points_balance: 150, purchases_count: 5});
    repository.listLedger.mockResolvedValueOnce([{
      id: '1', order_id: null, delta: 100, reason: 'welcome',
      created_at: '2026-01-01T00:00:00Z', expires_at: null
    }]);

    const result = await service.get({id: 'u1'} as any);
    expect(repository.findBalance).toHaveBeenCalledWith('u1');
    expect(repository.listLedger).toHaveBeenCalledWith('u1');
    expect(result.balance).toBe(150);
    expect(result.purchaseCount).toBe(5);
    expect(result.level).toBeDefined();
    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0].delta).toBe(100);
  });

  it('adds what can be spent, what is about to expire, and the invite code', async () => {
    repository.findBalance.mockResolvedValueOnce({points_balance: 150, purchases_count: 1});
    repository.listLedger.mockResolvedValueOnce([]);
    const result = await service.get({id: 'u1'} as any);
    expect(result.spendable).toBe(120);
    expect(result.expiringSoon).toEqual({points: 40, firstExpiry: '2026-11-03T00:00:00Z', days: 30});
    expect(result.referral).toEqual({code: 'f-abcd2345', invited: 3, rewarded: 1, rewardPoints: 100});
  });

  it('shows zeros rather than failing when the extras are empty', async () => {
    repository.findBalance.mockResolvedValueOnce({points_balance: 0, purchases_count: 0});
    repository.listLedger.mockResolvedValueOnce([]);
    repository.expiringSoon.mockResolvedValueOnce(null);
    repository.referral.mockResolvedValueOnce({code: null, summary: null});
    const result = await service.get({id: 'u1'} as any);
    expect(result.expiringSoon).toEqual({points: 0, firstExpiry: null, days: 30});
    expect(result.referral).toEqual({code: null, invited: 0, rewarded: 0, rewardPoints: 0});
  });

  it('should throw ServiceUnavailableException on DB error', async () => {
    repository.findBalance.mockRejectedValueOnce(new Error('DB Error'));
    repository.listLedger.mockResolvedValueOnce([]);
    await expect(service.get({id: 'u1'} as any)).rejects.toThrow(ServiceUnavailableException);
  });

  it('should throw ServiceUnavailableException when the profile row is missing', async () => {
    repository.findBalance.mockResolvedValueOnce(null);
    repository.listLedger.mockResolvedValueOnce([]);
    await expect(service.get({id: 'u1'} as any)).rejects.toThrow(ServiceUnavailableException);
  });
});
