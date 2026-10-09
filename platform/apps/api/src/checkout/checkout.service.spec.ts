/* eslint-disable */
import {BadRequestException, ServiceUnavailableException, UnprocessableEntityException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {PAYMENT_PROVIDER} from '../payments/payment-provider';
import {CheckoutRepository} from './checkout.repository';
import {CheckoutService} from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let repository: Record<string, jest.Mock>;
  let provider: any;
  let config: any;

  beforeEach(async () => {
    repository = {
      findOrderByIdempotencyKeyAsServiceRole: jest.fn(),
      findLiveTemplateBySlug: jest.fn(),
      findPointsBalance: jest.fn(),
      findTemplatePrice: jest.fn(),
      findTierDefaultPrice: jest.fn(),
      findCouponByCodeAsServiceRole: jest.fn(),
      createPendingCheckoutAsServiceRole: jest.fn(),
      saveProviderRefAsServiceRole: jest.fn().mockResolvedValue(undefined)
    };

    provider = {
      createCheckout: jest.fn().mockResolvedValue({redirectUrl: 'url', providerRef: 'ref', reference: 'mock-ref'})
    };

    config = {paymentsProvider: 'mock', manualPaymentInstructions: undefined};

    const module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {provide: CheckoutRepository, useValue: repository},
        {provide: PAYMENT_PROVIDER, useValue: provider},
        {provide: AppLogger, useValue: {error: jest.fn()}},
        {provide: AppConfigService, useValue: config}
      ]
    }).compile();

    service = module.get(CheckoutService);
  });

  const user = {id: 'u1'} as any;
  const body = (extra: object = {}) => ({
    templateSlug: 't1', tier: 'classic', kind: 'new', method: 'card', couple: {first: 'A', second: 'B'}, eventDate: '2026-06-20T00:00:00Z', ...extra
  }) as any;

  /** Mocks existing-order lookup, template, points balance; prices are mocked per test. */
  function mockHappyPrefix(balance = 0) {
    repository.findOrderByIdempotencyKeyAsServiceRole.mockResolvedValueOnce(null);
    repository.findLiveTemplateBySlug.mockResolvedValueOnce(
      {id: 't1', slug: 't1', name: {en: 'T1'}, tagline: {en: 't1'}, tier: 'classic', status: 'live', featured: false}
    );
    repository.findPointsBalance.mockResolvedValueOnce({points_balance: balance});
  }

  function rpcArgs(): any {
    return repository.createPendingCheckoutAsServiceRole.mock.calls[0][0];
  }

  it('should start checkout successfully', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 50000});
    repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'new_order', amount_minor: 50000, currency: 'EGP'});

    const result = await service.start(user, body(), 'idemp-1234');
    expect(result).toMatchObject({orderId: 'new_order', redirectUrl: 'url', amountMinor: 50000, currency: 'EGP'});
    expect(repository.createPendingCheckoutAsServiceRole).toHaveBeenCalledWith(expect.any(Object));
    expect(repository.findPointsBalance).toHaveBeenCalledWith('u1');
    expect(provider.createCheckout).toHaveBeenCalledWith({id: 'new_order', amountMinor: 50000, currency: 'EGP', method: 'card'});
  });

  it('uses the template-specific price when one exists (override wins)', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 99900});
    repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'o', amount_minor: 99900, currency: 'EGP'});

    await service.start(user, body(), 'idemp-1234');
    expect(rpcArgs()).toMatchObject({amountMinor: 99900, currency: 'EGP', discountTotalMinor: 0, tier: 'classic'});
    expect(repository.findTierDefaultPrice).not.toHaveBeenCalled(); // tier default never consulted
    expect(repository.findTemplatePrice).toHaveBeenCalledWith('t1', 'classic', 'EGP');
  });

  it('falls back to the tier default price when the template has no specific row', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce(null); // no template price
    repository.findTierDefaultPrice.mockResolvedValueOnce({amount_minor: 129900}); // tier default
    repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'o', amount_minor: 129900, currency: 'EGP'});

    await service.start(user, body(), 'idemp-1234');
    expect(rpcArgs()).toMatchObject({amountMinor: 129900, currency: 'EGP'});
    expect(repository.findTierDefaultPrice).toHaveBeenCalledWith('classic', 'EGP');
  });

  it('fails with price_not_found when neither a template nor a tier price exists', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce(null);
    repository.findTierDefaultPrice.mockResolvedValueOnce(null);

    const error: any = await service.start(user, body(), 'idemp-1234').catch(e => e);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(error.getResponse()).toMatchObject({code: 'price_not_found'});
    expect(repository.createPendingCheckoutAsServiceRole).not.toHaveBeenCalled();
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });

  it('answers 400 for an unknown or non-live template', async () => {
    repository.findOrderByIdempotencyKeyAsServiceRole.mockResolvedValueOnce(null);
    repository.findLiveTemplateBySlug.mockResolvedValueOnce(null);

    await expect(service.start(user, body(), 'idemp-1234')).rejects.toThrow(BadRequestException);
    expect(repository.createPendingCheckoutAsServiceRole).not.toHaveBeenCalled();
  });

  it('answers 503 when the database fails during checkout', async () => {
    repository.findOrderByIdempotencyKeyAsServiceRole.mockRejectedValueOnce(new Error('connection refused'));

    await expect(service.start(user, body(), 'idemp-1234')).rejects.toThrow(ServiceUnavailableException);
  });

  it('answers 503 when the create RPC returns nothing', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 50000});
    repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce(null);

    await expect(service.start(user, body(), 'idemp-1234')).rejects.toThrow(ServiceUnavailableException);
    expect(provider.createCheckout).not.toHaveBeenCalled();
  });

  it('keeps every amount an integer when a percent coupon is applied', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 129900});
    repository.findCouponByCodeAsServiceRole.mockResolvedValueOnce(
      {percent_off: 7.1, amount_off_minor: null, currency: 'EGP', max_uses: null, used_count: 0, expires_at: null, active: true}
    );
    repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'o', amount_minor: 120677, currency: 'EGP'});

    await service.start(user, body({couponCode: 'SAVE'}), 'idemp-1234');
    const args = rpcArgs();
    expect(repository.findCouponByCodeAsServiceRole).toHaveBeenCalledWith('save');
    // floor(129900 * 7.1 / 100) = 9222 minor units off (cap is 30% = 38970).
    expect(args.discountTotalMinor).toBe(9222);
    expect(args.amountMinor).toBe(129900 - 9222);
    expect(Number.isInteger(args.amountMinor)).toBe(true);
    expect(Number.isInteger(args.discountTotalMinor)).toBe(true);
  });

  it('rejects a fixed-amount coupon in a different currency', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 129900});
    repository.findCouponByCodeAsServiceRole.mockResolvedValueOnce(
      {percent_off: null, amount_off_minor: 1000, currency: 'USD', max_uses: null, used_count: 0, expires_at: null, active: true}
    );

    await expect(service.start(user, body({couponCode: 'usd'}), 'idemp-1234')).rejects.toThrow(BadRequestException);
    expect(repository.createPendingCheckoutAsServiceRole).not.toHaveBeenCalled();
  });

  it('rejects an unknown coupon', async () => {
    mockHappyPrefix();
    repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 129900});
    repository.findCouponByCodeAsServiceRole.mockResolvedValueOnce(null);

    await expect(service.start(user, body({couponCode: 'nope'}), 'idemp-1234')).rejects.toThrow(BadRequestException);
  });

  it('uses the fixed minor-unit prices for edits packs without a price lookup', async () => {
    mockHappyPrefix();
    repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'o', amount_minor: 9900, currency: 'EGP'});

    await service.start(user, body({kind: 'edits'}), 'idemp-1234');
    expect(rpcArgs()).toMatchObject({amountMinor: 9900, currency: 'EGP'});
    expect(repository.findTemplatePrice).not.toHaveBeenCalled();
    expect(repository.findTierDefaultPrice).not.toHaveBeenCalled();
  });

  it('should return existing order if idempotency key matches', async () => {
    repository.findOrderByIdempotencyKeyAsServiceRole.mockResolvedValueOnce({id: 'old_order', amount_minor: 50000, currency: 'EGP'});

    const result = await service.start(user, body(), 'idemp-1234');
    expect(result.orderId).toBe('old_order');
    expect(repository.findOrderByIdempotencyKeyAsServiceRole).toHaveBeenCalledWith('u1', 'idemp-1234');
    expect(repository.createPendingCheckoutAsServiceRole).not.toHaveBeenCalled();
  });

  describe('manual payments', () => {
    const methods = [{id: 'instapay', label: {ar: 'a', en: 'InstaPay'}, details: {ar: 'b', en: 'pay to x'}}];

    beforeEach(() => {
      config.paymentsProvider = 'manual';
      config.manualPaymentInstructions = {methods};
      provider.createCheckout.mockResolvedValue({redirectUrl: '/checkout/result/new_order', providerRef: 'INV-ABC234', reference: 'INV-ABC234'});
    });

    it('creates a manual order and returns the payment block', async () => {
      mockHappyPrefix();
      repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 50000});
      repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'new_order', amount_minor: 50000, currency: 'EGP'});

      const before = Date.now();
      const result: any = await service.start(user, body(), 'idemp-1234');
      expect(rpcArgs()).toMatchObject({provider: 'manual'});
      expect(result.reference).toBe('INV-ABC234');
      expect(result.payment).toMatchObject({reference: 'INV-ABC234', amountMinor: 50000, currency: 'EGP', methods});
      const expires = Date.parse(result.payment.expiresAt);
      expect(expires).toBeGreaterThanOrEqual(before + 72 * 3_600_000);
      expect(expires).toBeLessThan(Date.now() + 72 * 3_600_000 + 1000);
      expect(repository.saveProviderRefAsServiceRole).toHaveBeenCalledWith('new_order', 'INV-ABC234');
    });

    it('keeps the existing reference and the original expiry on an idempotent retry', async () => {
      const created = '2026-10-01T00:00:00.000Z';
      repository.findOrderByIdempotencyKeyAsServiceRole.mockResolvedValueOnce(
        {id: 'old_order', amount_minor: 50000, currency: 'EGP', provider_ref: 'INV-KEEP22', created_at: created}
      );
      const result: any = await service.start(user, body(), 'idemp-1234');
      expect(provider.createCheckout).not.toHaveBeenCalled();
      expect(result.payment.reference).toBe('INV-KEEP22');
      expect(result.payment.expiresAt).toBe('2026-10-04T00:00:00.000Z');
    });

    it('does not include a payment block for the mock provider', async () => {
      config.paymentsProvider = 'mock';
      mockHappyPrefix();
      repository.findTemplatePrice.mockResolvedValueOnce({amount_minor: 50000});
      repository.createPendingCheckoutAsServiceRole.mockResolvedValueOnce({order_id: 'new_order', amount_minor: 50000, currency: 'EGP'});
      const result: any = await service.start(user, body(), 'idemp-1234');
      expect(result.payment).toBeUndefined();
      expect(rpcArgs()).toMatchObject({provider: 'mock'});
    });
  });
});
