import type {ManualPaymentInstructions} from '../config/env.schema';

export interface ManualPaymentDetails {
  reference: string;
  amountMinor: number;
  currency: string;
  /** ISO timestamp: order creation + 72 h, after which an unpaid order expires. */
  expiresAt: string;
  methods: ManualPaymentInstructions['methods'];
}

export const MANUAL_ORDER_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * The `payment` block shared by checkout and orders for manual-provider orders.
 * `createdAt` falls back to now when absent or unparsable (a freshly created order).
 */
export function buildManualPayment(input: {
  reference: string;
  amountMinor: number;
  currency: string;
  createdAt?: string;
  instructions?: ManualPaymentInstructions;
}): ManualPaymentDetails {
  const parsed = input.createdAt === undefined ? Number.NaN : Date.parse(input.createdAt);
  const createdMs = Number.isNaN(parsed) ? Date.now() : parsed;
  return {
    reference: input.reference,
    amountMinor: input.amountMinor,
    currency: input.currency,
    expiresAt: new Date(createdMs + MANUAL_ORDER_TTL_MS).toISOString(),
    methods: input.instructions?.methods ?? []
  };
}
