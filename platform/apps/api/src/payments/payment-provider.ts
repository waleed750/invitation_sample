export type PaymentStatus = 'paid' | 'failed' | 'pending';

export interface CheckoutOrder {
  id: string;
  amountMinor: number;
  currency: string;
  method: 'card' | 'wallet' | 'fawry';
}

export interface PaymentProvider {
  createCheckout(order: CheckoutOrder): Promise<{redirectUrl: string; providerRef: string; reference?: string}>;
  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{providerRef: string; status: PaymentStatus; amountMinor: number; currency: string}>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
