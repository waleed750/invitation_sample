import {Injectable, NotFoundException} from '@nestjs/common';
import {randomInt} from 'node:crypto';
import type {CheckoutOrder, PaymentProvider, PaymentStatus} from './payment-provider';

/** Base32-style alphabet without the ambiguous I, O, 0 and 1 (32 symbols). */
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERENCE_LENGTH = 6;

/** A short, human-typable payment reference, e.g. `INV-7KQ2MX`. */
export function generatePaymentReference(): string {
  let suffix = '';
  for (let index = 0; index < REFERENCE_LENGTH; index += 1) {
    suffix += REFERENCE_ALPHABET.charAt(randomInt(REFERENCE_ALPHABET.length));
  }
  return `INV-${suffix}`;
}

/**
 * Manual payments (B7a): the customer pays outside the site (InstaPay, wallet,
 * bank transfer) quoting the reference; an admin confirms in the admin API.
 * There is no gateway, so no webhook and no way for a customer to settle an order.
 */
@Injectable()
export class ManualPaymentProvider implements PaymentProvider {
  createCheckout(order: CheckoutOrder): Promise<{redirectUrl: string; providerRef: string; reference?: string}> {
    const reference = generatePaymentReference();
    return Promise.resolve({
      // Web result page path (the web app prefixes the locale).
      redirectUrl: `/checkout/result/${order.id}`,
      providerRef: reference,
      reference
    });
  }

  verifyWebhook(): Promise<{providerRef: string; status: PaymentStatus; amountMinor: number; currency: string}> {
    // Manual payments have no webhook: the public webhook route answers 404.
    return Promise.reject(new NotFoundException('Payment provider not found'));
  }
}
