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
    const result = await provider.createCheckout({id: '1', amountMinor: 10000, currency: 'EGP', method: 'card'});
    expect(result.providerRef).toBe('mock_1');
    expect(result.redirectUrl).toBe('/v1/dev/payments/mock/1/succeed');
  });

  it('should verify correct signature', async () => {
    const payload = JSON.stringify({providerRef: 'ref', status: 'paid', amountMinor: 10000, currency: 'EGP'});
    const rawBody = Buffer.from(payload);
    const signature = provider.sign(rawBody);

    const result = await provider.verifyWebhook(rawBody, {'x-mock-signature': signature});
    expect(result.providerRef).toBe('ref');
    expect(result.amountMinor).toBe(10000);
    expect(result.currency).toBe('EGP');
  });

  it('should reject payloads with fractional minor units or a bad currency', async () => {
    for (const body of [
      {providerRef: 'ref', status: 'paid', amountMinor: 100.5, currency: 'EGP'},
      {providerRef: 'ref', status: 'paid', amountMinor: 100, currency: 'egp'},
      {providerRef: 'ref', status: 'paid', amountMinor: 100}
    ]) {
      const rawBody = Buffer.from(JSON.stringify(body));
      await expect(provider.verifyWebhook(rawBody, {'x-mock-signature': provider.sign(rawBody)})).rejects.toThrow(UnauthorizedException);
    }
  });

  it('should reject invalid signature', async () => {
    const payload = JSON.stringify({providerRef: 'ref', status: 'paid', amountMinor: 10000, currency: 'EGP'});
    const rawBody = Buffer.from(payload);

    await expect(provider.verifyWebhook(rawBody, {'x-mock-signature': 'bad-sig'})).rejects.toThrow(UnauthorizedException);
    await expect(provider.verifyWebhook(rawBody, {})).rejects.toThrow(UnauthorizedException);
  });
});
