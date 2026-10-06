/* eslint-disable */
import {UnauthorizedException} from '@nestjs/common';
import {MockPaymentProvider} from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  let provider: MockPaymentProvider;
  let config: any;

  beforeEach(() => {
    config = {
      isProduction: false,
      paymentsMockSecret: 'super-secret-key-that-is-long-enough'
    };
    provider = new MockPaymentProvider(config);
  });

  it('should refuse to start in production', () => {
    expect(() => new MockPaymentProvider({isProduction: true} as any)).toThrow('Mock payment provider is disabled in production');
  });

  it('should create checkout', async () => {
    const result = await provider.createCheckout({id: '1', amountEgp: 100, method: 'card'});
    expect(result.providerRef).toBe('mock_1');
    expect(result.redirectUrl).toBe('/v1/dev/payments/mock/1/succeed');
  });

  it('should verify correct signature', async () => {
    const payload = JSON.stringify({providerRef: 'ref', status: 'paid', amountEgp: 100});
    const rawBody = Buffer.from(payload);
    const signature = provider.sign(rawBody);

    const result = await provider.verifyWebhook(rawBody, {'x-mock-signature': signature});
    expect(result.providerRef).toBe('ref');
  });

  it('should reject invalid signature', async () => {
    const payload = JSON.stringify({providerRef: 'ref', status: 'paid', amountEgp: 100});
    const rawBody = Buffer.from(payload);

    await expect(provider.verifyWebhook(rawBody, {'x-mock-signature': 'bad-sig'})).rejects.toThrow(UnauthorizedException);
    await expect(provider.verifyWebhook(rawBody, {})).rejects.toThrow(UnauthorizedException);
  });
});
