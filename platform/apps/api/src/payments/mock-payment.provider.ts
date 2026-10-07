import {Injectable, UnauthorizedException} from '@nestjs/common';
import {createHmac, timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {AppConfigService} from '../config/app-config.service';
import type {CheckoutOrder, PaymentProvider, PaymentStatus} from './payment-provider';

const webhookPayload = z.object({
  providerRef: z.string().min(1),
  status: z.enum(['paid', 'failed', 'pending']),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/)
}).strict();

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  constructor(private readonly config: AppConfigService) {
    if (config.isProduction && config.paymentsProvider !== 'manual') throw new Error('Mock payment provider is disabled in production');
  }

  createCheckout(order: CheckoutOrder): Promise<{redirectUrl: string; providerRef: string; reference?: string}> {
    const providerRef = `mock_${order.id}`;
    const reference = order.method === 'fawry' ? this.referenceFor(order.id) : undefined;
    return Promise.resolve({
      redirectUrl: `/v1/dev/payments/mock/${order.id}/succeed`,
      providerRef,
      ...(reference === undefined ? {} : {reference})
    });
  }

  async verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{providerRef: string; status: PaymentStatus; amountMinor: number; currency: string}> {
    const supplied = headers['x-mock-signature'];
    const signature = Array.isArray(supplied) ? supplied[0] : supplied;
    if (signature === undefined || !this.isValidSignature(rawBody, signature)) {
      throw new UnauthorizedException();
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(rawBody.toString('utf8')) as unknown;
    } catch {
      throw new UnauthorizedException();
    }
    const result = webhookPayload.safeParse(decoded);
    if (!result.success) throw new UnauthorizedException();
    return Promise.resolve(result.data);
  }

  sign(rawBody: Buffer): string {
    return createHmac('sha256', this.config.paymentsMockSecret).update(rawBody).digest('hex');
  }

  private isValidSignature(rawBody: Buffer, supplied: string): boolean {
    const expected = Buffer.from(this.sign(rawBody), 'hex');
    if (!/^[a-f\d]{64}$/iu.test(supplied)) return false;
    const actual = Buffer.from(supplied, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private referenceFor(orderId: string): string {
    const digest = createHmac('sha256', this.config.paymentsMockSecret).update(orderId).digest();
    return String(100_000_000 + (digest.readUInt32BE(0) % 900_000_000));
  }
}
