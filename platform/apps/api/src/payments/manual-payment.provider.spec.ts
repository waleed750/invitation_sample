import {NotFoundException} from '@nestjs/common';
import {generatePaymentReference, ManualPaymentProvider} from './manual-payment.provider';

describe('ManualPaymentProvider', () => {
  const provider = new ManualPaymentProvider();

  it('generates INV- references from the unambiguous alphabet', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(generatePaymentReference()).toMatch(/^INV-[A-HJ-NP-Z2-9]{6}$/);
    }
  });

  it('generates distinct references', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i += 1) seen.add(generatePaymentReference());
    expect(seen.size).toBe(2000);
  });

  it('returns the reference as providerRef and the web result page as redirect', async () => {
    const result = await provider.createCheckout({id: 'order-1', amountMinor: 129900, currency: 'EGP', method: 'card'});
    expect(result.reference).toMatch(/^INV-[A-HJ-NP-Z2-9]{6}$/);
    expect(result.providerRef).toBe(result.reference);
    expect(result.redirectUrl).toBe('/checkout/result/order-1');
  });

  it('has no webhook', async () => {
    await expect(provider.verifyWebhook()).rejects.toThrow(NotFoundException);
  });
});
