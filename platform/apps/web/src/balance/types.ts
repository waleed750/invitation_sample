export interface Balance {
  balanceMinor: number;
  currency: 'EGP';
  minTopupMinor: number;
  maxTopupMinor: number;
  bonusPercent: number;
  bonusMinTopupMinor: number;
  awaitingOrders: {id: string; tier: string; amountMinor: number; currency: string; createdAt: string; templateSlug: string | null}[];
  shortfallMinor: number;
  paymentInstructions: {methods?: PaymentMethodInstruction[]} | null;
}

export interface LedgerItem {
  id: string;
  kind: 'topup' | 'bonus' | 'purchase' | 'refund' | 'admin';
  amountMinor: number;
  orderId: string | null;
  topupId: string | null;
  note: string | null;
  createdAt: string;
}

export interface Topup {
  id: string;
  reference: string;
  amountMinor: number;
  /** The exact amount to transfer (request + unique piasters). */
  expectedMinor: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface PaymentMethodInstruction {
  id: string;
  /** Optional https link that opens the payment app (for example InstaPay). */
  url?: string;
  label: {ar: string; en: string};
  details: {ar: string; en: string};
}

export interface TopupWithInstructions extends Topup {
  instructions: {methods?: PaymentMethodInstruction[]} | null;
}

export interface PayResult {
  paid: boolean;
  orderId: string;
  status: 'paid' | 'awaiting_balance';
  balanceMinor: number;
  shortfallMinor: number;
}

export interface PendingTopup extends Topup {
  customer: {id: string; name: string | null; phone: string | null; email: string | null} | null;
  ageHours: number;
}

export interface OrderStatus {
  orderId: string;
  status: string;
  paid: boolean;
  amountMinor: number;
  currency: string;
  invitationId: string | null;
  invitationSlug: string | null;
}
