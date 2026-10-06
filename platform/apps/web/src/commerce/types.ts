import type {Level, Tier} from '@platform/shared';

export type OrderKind = 'new' | 'extension' | 'edits';
export type PaymentMethod = 'card' | 'wallet' | 'fawry';
export type OrderStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  templateSlug: string;
  tier: Tier;
  kind: OrderKind;
  method: PaymentMethod;
  status: OrderStatus;
  amountEgp: number;
  discountEgp: number;
  couponCode?: string;
  pointsRedeemed?: number;
  fawryReference?: string;
  createdAt: string;
  paidAt?: string;
}

export interface DraftInvitation {
  id: string;
  orderId: string;
  templateSlug: string;
  tier: Tier;
  couple: {first: string; second: string};
  eventDate: string;
  status: 'draft';
  editsAllowed: number;
  editsUsed: number;
  firstPublishedAt?: string;
  onlineUntil?: string;
  entitlementNotes?: string[];
}

export interface Invitation extends Omit<DraftInvitation, 'status'> {
  status: 'draft' | 'published';
}

export interface PointsLedgerEntry {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Session {
  phone: string;
  locale: string;
}

export interface StartCheckoutInput {
  templateSlug: string;
  tier: Tier;
  kind: OrderKind;
  method: PaymentMethod;
  couponCode?: string;
  pointsToRedeem?: number;
  couple: {first: string; second: string};
  eventDate: string;
}

export interface CommerceState {
  session?: Session;
  orders: Order[];
  invitations: Invitation[];
  points: {
    purchaseCount: number;
    ledger: PointsLedgerEntry[];
  };
  checkoutDetails?: Record<string, {couple: {first: string; second: string}; eventDate: string}>;
}

export interface CommerceClient {
  sendOtp(phone: string): Promise<{ok: true}>;
  verifyOtp(phone: string, code: string, locale?: string): Promise<Session>;
  startCheckout(input: StartCheckoutInput): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  simulatePayment(orderId: string, outcome: 'succeed' | 'fail' | 'fawry_reference' | 'fawry_paid'): Promise<Order>;
  listInvitations(): Promise<Invitation[]>;
  listOrders(): Promise<Order[]>;
  getPoints(): Promise<{balance: number; purchaseCount: number; level: Level; ledger: PointsLedgerEntry[]}>;
}

