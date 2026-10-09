/* eslint-disable */
import {NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {OrdersRepository} from './orders.repository';
import {AppConfigService} from '../config/app-config.service';
import {OrdersService} from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: {listByUser: jest.Mock; findByIdForUser: jest.Mock};
  let config: any;

  beforeEach(async () => {
    repository = {listByUser: jest.fn(), findByIdForUser: jest.fn()};

    config = {manualPaymentInstructions: undefined};
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {provide: OrdersRepository, useValue: repository},
        {provide: AppConfigService, useValue: config},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(OrdersService);
  });

  const validOrder = {
    id: '1', template_id: 't1', tier: 'classic', kind: 'new', amount_minor: 10000, currency: 'EGP',
    status: 'paid', provider: 'mock', provider_ref: 'mock_1',
    discount_total_minor: 0, points_redeemed: 0, created_at: '2026-01-01T00:00:00Z', paid_at: '2026-01-01T00:01:00Z'
  };

  it('should list orders', async () => {
    repository.listByUser.mockResolvedValueOnce([validOrder]);
    const result = await service.list({id: 'u1'} as any);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0]).toMatchObject({amountMinor: 10000, currency: 'EGP', discountTotalMinor: 0});
    expect(Number.isInteger(result[0].amountMinor)).toBe(true);
  });

  it('should reject non-integer minor amounts', async () => {
    repository.listByUser.mockResolvedValueOnce([{...validOrder, amount_minor: 100.5}]);
    await expect(service.list({id: 'u1'} as any)).rejects.toThrow(ServiceUnavailableException);
  });

  it('should get an order', async () => {
    repository.findByIdForUser.mockResolvedValueOnce(validOrder);
    const result = await service.get({id: 'u1'} as any, '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException when no row is visible', async () => {
    repository.findByIdForUser.mockResolvedValueOnce(null);
    await expect(service.get({id: 'u1'} as any, '1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ServiceUnavailableException on generic DB error', async () => {
    repository.findByIdForUser.mockRejectedValueOnce(new Error('DB error'));
    await expect(service.get({id: 'u1'} as any, '1')).rejects.toThrow(ServiceUnavailableException);
  });

  describe('templateSlug and manual payment block', () => {
    const user = {id: 'u1'} as any;
    const manualOrder = {
      ...validOrder, status: 'pending', provider: 'manual', provider_ref: 'MAN-123', paid_at: null,
      created_at: '2026-01-01T00:00:00.000Z', template: {slug: 'elegante'}
    };
    const methods = [{kind: 'instapay', label: 'InstaPay', value: 'x@instapay'}];

    it('maps templateSlug from the embedded relation and null when absent', async () => {
      repository.listByUser.mockResolvedValueOnce([{...validOrder, template: {slug: 'citystars'}}, {...validOrder, template: null}]);
      const result = await service.list(user);
      expect(result[0].templateSlug).toBe('citystars');
      expect(result[1].templateSlug).toBeNull();
    });

    it('adds the payment block for manual orders on list and get, any status', async () => {
      config.manualPaymentInstructions = {methods};
      repository.listByUser.mockResolvedValueOnce([manualOrder, {...manualOrder, status: 'paid'}]);
      const [pending, paid] = await service.list(user);
      expect(pending.payment).toEqual({
        reference: 'MAN-123', amountMinor: 10000, currency: 'EGP', expiresAt: '2026-01-04T00:00:00.000Z', methods
      });
      expect(paid.payment).toBeDefined();
      repository.findByIdForUser.mockResolvedValueOnce(manualOrder);
      expect((await service.get(user, '1')).payment).toMatchObject({reference: 'MAN-123', expiresAt: '2026-01-04T00:00:00.000Z'});
    });

    it('uses an empty methods array when instructions are unset', async () => {
      repository.findByIdForUser.mockResolvedValueOnce(manualOrder);
      expect((await service.get(user, '1')).payment?.methods).toEqual([]);
    });

    it('omits the payment block for non-manual orders and keeps existing fields', async () => {
      repository.findByIdForUser.mockResolvedValueOnce(validOrder);
      const result = await service.get(user, '1');
      expect(result).not.toHaveProperty('payment');
      expect(result).toMatchObject({reference: 'mock_1', templateId: 't1', templateSlug: null});
    });
  });
});
