/* eslint-disable */
import {ConflictException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {PaymentsRepository} from './payments.repository';
import {MockPaymentProvider} from './mock-payment.provider';
import {PAYMENT_PROVIDER} from './payment-provider';
import {PaymentsService} from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repository: {
    findOrderByIdAsServiceRole: jest.Mock;
    findOrderByProviderRefAsServiceRole: jest.Mock;
    fulfillPaidOrderAsServiceRole: jest.Mock;
    markOrderFailedAsServiceRole: jest.Mock;
  };
  let provider: any;

  beforeEach(async () => {
    repository = {
      findOrderByIdAsServiceRole: jest.fn(),
      findOrderByProviderRefAsServiceRole: jest.fn(),
      fulfillPaidOrderAsServiceRole: jest.fn().mockResolvedValue(undefined),
      markOrderFailedAsServiceRole: jest.fn().mockResolvedValue(undefined)
    };

    provider = {
      verifyWebhook: jest.fn()
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {provide: PAYMENT_PROVIDER, useValue: provider},
        {provide: MockPaymentProvider, useValue: {sign: jest.fn().mockReturnValue('signature')}},
        {provide: PaymentsRepository, useValue: repository},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(PaymentsService);
  });

  const order = (extra: object = {}) => ({id: 'order_1', amount_minor: 10000, currency: 'EGP', status: 'pending', ...extra});
  const event = (extra: object = {}) => ({providerRef: 'ref_1', status: 'paid', amountMinor: 10000, currency: 'EGP', ...extra});

  it('should handle successful webhook', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event());
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order());

    const result = await service.handleWebhook('mock', Buffer.from(''), {});
    expect(result).toEqual({ok: true});
    expect(repository.findOrderByProviderRefAsServiceRole).toHaveBeenCalledWith('ref_1');
    expect(repository.fulfillPaidOrderAsServiceRole).toHaveBeenCalledWith('order_1');
  });

  it('should handle failed webhook', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event({status: 'failed'}));
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order());

    const result = await service.handleWebhook('mock', Buffer.from(''), {});
    expect(result).toEqual({ok: true});
    expect(repository.markOrderFailedAsServiceRole).toHaveBeenCalledWith('order_1');
    expect(repository.fulfillPaidOrderAsServiceRole).not.toHaveBeenCalled();
  });

  it('should reject unknown provider', async () => {
    await expect(service.handleWebhook('unknown', Buffer.from(''), {})).rejects.toThrow(NotFoundException);
  });

  it('should answer 404 when no order matches the provider reference', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event());
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(null);

    await expect(service.handleWebhook('mock', Buffer.from(''), {})).rejects.toThrow(NotFoundException);
  });

  it('should answer 503 when the order lookup fails', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event());
    repository.findOrderByProviderRefAsServiceRole.mockRejectedValueOnce(new Error('connection refused'));

    await expect(service.handleWebhook('mock', Buffer.from(''), {})).rejects.toThrow(ServiceUnavailableException);
  });

  it('should answer 503 when fulfilling the order fails', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event());
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order());
    repository.fulfillPaidOrderAsServiceRole.mockRejectedValueOnce(new Error('deadlock'));

    await expect(service.handleWebhook('mock', Buffer.from(''), {})).rejects.toThrow(ServiceUnavailableException);
  });

  it('should reject amount mismatch', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event());
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order({amount_minor: 5000}));

    await expect(service.handleWebhook('mock', Buffer.from(''), {})).rejects.toThrow(ConflictException);
  });

  it('should reject currency mismatch even when the amount matches', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event({currency: 'USD'}));
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order());

    await expect(service.handleWebhook('mock', Buffer.from(''), {})).rejects.toThrow(ConflictException);
    expect(repository.fulfillPaidOrderAsServiceRole).not.toHaveBeenCalled();
    expect(repository.markOrderFailedAsServiceRole).not.toHaveBeenCalled();
  });

  it('should gracefully handle already fulfilled order', async () => {
    provider.verifyWebhook.mockResolvedValueOnce(event());
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order({status: 'paid'}));

    const result = await service.handleWebhook('mock', Buffer.from(''), {});
    expect(result).toEqual({ok: true});
    expect(repository.fulfillPaidOrderAsServiceRole).not.toHaveBeenCalled();
    expect(repository.markOrderFailedAsServiceRole).not.toHaveBeenCalled();
  });

  it('should simulate webhook internally', async () => {
    repository.findOrderByIdAsServiceRole.mockResolvedValueOnce(order({user_id: 'user_1'}));
    provider.verifyWebhook.mockResolvedValueOnce(event({providerRef: 'mock_order_1'}));
    repository.findOrderByProviderRefAsServiceRole.mockResolvedValueOnce(order());

    const result = await service.simulate('order_1', 'paid', 'user_1');
    expect(result).toEqual({ok: true});
    expect(repository.fulfillPaidOrderAsServiceRole).toHaveBeenCalledWith('order_1');
  });

  it("should not let a user settle someone else's order via the dev shortcut", async () => {
    repository.findOrderByIdAsServiceRole.mockResolvedValueOnce(order({user_id: 'someone_else'}));

    await expect(service.simulate('order_1', 'paid', 'user_1')).rejects.toThrow(NotFoundException);
    expect(repository.fulfillPaidOrderAsServiceRole).not.toHaveBeenCalled();
  });
});
