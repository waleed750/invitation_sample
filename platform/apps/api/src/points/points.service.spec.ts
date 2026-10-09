/* eslint-disable */
import {ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {PointsRepository} from './points.repository';
import {PointsService} from './points.service';

describe('PointsService', () => {
  let service: PointsService;
  let repository: {findBalance: jest.Mock; listLedger: jest.Mock};

  beforeEach(async () => {
    repository = {findBalance: jest.fn(), listLedger: jest.fn()};

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
