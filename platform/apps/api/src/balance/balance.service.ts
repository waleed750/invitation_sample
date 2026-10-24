import {
  BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, Optional,
  ServiceUnavailableException
} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {AppConfigService} from '../config/app-config.service';
import {NotificationsService} from '../notifications/notifications.service';
import {BalanceRepository, type PendingTopupRow, type TopupRow} from './balance.repository';

export class CreateTopupBody extends createZodDto(z.object({amountMinor: z.number().int().min(1).max(100_000_000)}).strict()) {}
export class LedgerQuery extends createZodDto(z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  before: z.iso.datetime({offset: true}).optional()
}).strict()) {}
export class ConfirmTopupBody extends createZodDto(z.object({
  paidAmountMinor: z.number().int().min(1),
  txnRef: z.string().trim().min(1).max(120),
  note: z.string().trim().max(500).optional(),
  acceptMismatch: z.boolean().optional()
}).strict()) {}
export class RejectTopupBody extends createZodDto(z.object({reason: z.string().trim().min(3).max(500)}).strict()) {}
export class AdjustCreditBody extends createZodDto(z.object({
  userId: z.uuid(),
  deltaMinor: z.number().int().refine((value) => value !== 0, 'must not be zero').refine((value) => Math.abs(value) <= 1_000_000_000, 'too large'),
  note: z.string().trim().min(3).max(300)
}).strict()) {}
export class RefundToBalanceBody extends createZodDto(z.object({note: z.string().trim().min(3).max(300)}).strict()) {}
export class IdParams extends createZodDto(z.object({id: z.uuid()})) {}

export interface BalanceResponse {
  balanceMinor: number;
  currency: 'EGP';
  minTopupMinor: number;
  maxTopupMinor: number;
  bonusPercent: number;
  bonusMinTopupMinor: number;
  awaitingOrders: {id: string; tier: string; amountMinor: number; currency: string; createdAt: string; templateSlug: string | null}[];
  /** The smallest top-up that pays every awaiting order (0 when nothing waits). */
  shortfallMinor: number;
  /** Where to send a transfer (the operator-configured manual payment methods). */
  paymentInstructions: unknown;
}

export interface TopupResponse {
  id: string;
  reference: string;
  amountMinor: number;
  /** The exact amount to transfer (request + unique piasters). */
  expectedMinor: number;
  currency: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: string;
  paid: boolean;
  amountMinor: number;
  currency: string;
  invitationId: string | null;
  invitationSlug: string | null;
}

export interface PayOrderResponse {
  paid: boolean;
  orderId: string;
  status: 'paid' | 'awaiting_balance';
  balanceMinor: number;
  shortfallMinor: number;
}

const unavailable = (): ServiceUnavailableException => new ServiceUnavailableException('Balance service unavailable');

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function toTopup(row: TopupRow): TopupResponse {
  return {
    id: row.id, reference: row.reference, amountMinor: row.amount_minor, expectedMinor: row.amount_minor + row.extra_minor,
    currency: row.currency, status: row.status, expiresAt: row.expires_at, createdAt: row.created_at
  };
}

/** Maps a function's refusal onto an HTTP error; anything unknown is a 503 (never leak database text). */
function refusal(result: Record<string, unknown> | null, notFound: string): HttpException {
  const reason = text(result?.reason);
  switch (reason) {
    case 'not_found': return new NotFoundException(notFound);
    case 'not_admin': return new ForbiddenException('Admin only');
    case 'below_minimum': return new BadRequestException({code: 'below_minimum', message: 'The amount is below the minimum top-up', minMinor: num(result?.min_minor)});
    case 'above_maximum': return new BadRequestException({code: 'above_maximum', message: 'The amount is above the maximum top-up', maxMinor: num(result?.max_minor)});
    case 'too_many_pending': return new ConflictException({code: 'too_many_pending', message: 'Finish or wait for your pending top-ups first'});
    case 'amount_mismatch':
      return new ConflictException({code: 'amount_mismatch', message: 'The received amount differs from the expected amount', expectedMinor: num(result?.expected_minor), receivedMinor: num(result?.received_minor)});
    case 'note_required': return new BadRequestException({code: 'note_required', message: 'A note is required to accept a different amount'});
    case 'invalid_amount': return new BadRequestException({code: 'invalid_amount', message: 'Invalid amount'});
    case 'insufficient_balance': return new ConflictException({code: 'insufficient_balance', message: 'The balance is too low'});
    case 'not_pending': case 'not_payable': case 'not_cancellable': case 'not_refundable': case 'currency':
      return new ConflictException({code: reason, message: 'The operation is not allowed in the current state', status: text(result?.status) ?? undefined});
    default: return unavailable();
  }
}

@Injectable()
export class BalanceService {
  constructor(
    private readonly repository: BalanceRepository,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
    @Optional() private readonly notifications?: NotificationsService
  ) {}

  private async guarded<T>(call: () => Promise<T>, what: string): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`${what} failed`);
      throw unavailable();
    }
  }

  async get(user: RequestUser): Promise<BalanceResponse> {
    return this.guarded(async () => {
      const [balance, settings, awaiting] = await Promise.all([
        this.repository.balance(user.id), this.repository.settings(user.id), this.repository.awaitingOrders(user.id)
      ]);
      const owed = awaiting.reduce((sum, order) => sum + order.amount_minor, 0);
      return {
        balanceMinor: balance, currency: 'EGP' as const,
        minTopupMinor: settings.min_topup_minor, maxTopupMinor: settings.max_topup_minor,
        bonusPercent: settings.bonus_percent, bonusMinTopupMinor: settings.bonus_min_topup_minor,
        awaitingOrders: awaiting.map((order) => ({
          id: order.id, tier: order.tier, amountMinor: order.amount_minor, currency: order.currency,
          createdAt: order.created_at, templateSlug: order.template?.slug ?? null
        })),
        shortfallMinor: Math.max(0, owed - balance),
        paymentInstructions: this.paymentInstructions()
      };
    }, 'balance read');
  }

  async ledger(user: RequestUser, query: LedgerQuery) {
    return this.guarded(async () => {
      const rows = await this.repository.ledger(user.id, query.limit, query.before ?? null);
      return {
        items: rows.map((row) => ({
          id: row.id, kind: row.kind, amountMinor: row.amount_minor, orderId: row.order_id, topupId: row.topup_id,
          note: row.note, createdAt: row.created_at
        })),
        nextBefore: rows.length === query.limit ? (rows[rows.length - 1]?.created_at ?? null) : null
      };
    }, 'ledger read');
  }

  async topups(user: RequestUser): Promise<TopupResponse[]> {
    return this.guarded(async () => (await this.repository.topups(user.id)).map(toTopup), 'topups read');
  }

  /** The instructions shown with a top-up reference (the same JSON the manual order flow uses). */
  paymentInstructions(): unknown {
    return this.config.manualPaymentInstructions ?? null;
  }

  async createTopup(user: RequestUser, body: CreateTopupBody): Promise<TopupResponse & {instructions: unknown}> {
    const result = await this.guarded(() => this.repository.createTopup(user.id, body.amountMinor), 'topup create');
    if (result?.ok !== true) throw refusal(result, 'User not found');
    return {
      id: String(result.id), reference: String(result.reference), amountMinor: num(result.amount_minor), expectedMinor: num(result.expected_minor),
      currency: 'EGP', status: 'pending', expiresAt: String(result.expires_at), createdAt: new Date().toISOString(),
      instructions: this.paymentInstructions()
    };
  }

  /** Pays an order from the balance. A balance that is too low parks the order as "awaiting balance" (not an error). */
  async payOrder(user: RequestUser, orderId: string): Promise<PayOrderResponse> {
    const result = await this.guarded(() => this.repository.payOrder(user.id, orderId), 'pay with balance');
    if (result?.ok === true) {
      return {paid: true, orderId, status: 'paid', balanceMinor: num(result.balance_minor), shortfallMinor: 0};
    }
    if (text(result?.reason) === 'insufficient_balance') {
      return {paid: false, orderId, status: 'awaiting_balance', balanceMinor: num(result?.balance_minor), shortfallMinor: num(result?.shortfall_minor)};
    }
    throw refusal(result, 'Order not found');
  }

  /** Light status for the waiting screen: just enough to know when to move on. */
  async orderStatus(user: RequestUser, orderId: string): Promise<OrderStatusResponse> {
    const row = await this.guarded(() => this.repository.orderStatus(user.id, orderId), 'order status');
    if (row === null) throw new NotFoundException('Order not found');
    return {
      orderId: row.id, status: row.status, paid: row.status === 'paid', amountMinor: row.amount_minor, currency: row.currency,
      invitationId: row.invitation_id, invitationSlug: row.invitation_slug
    };
  }

  async cancelOrder(user: RequestUser, orderId: string): Promise<{ok: true}> {
    const result = await this.guarded(() => this.repository.cancelOrder(user.id, orderId), 'cancel awaiting order');
    if (result?.ok !== true) throw refusal(result, 'Order not found');
    return {ok: true};
  }

  // ---- admin

  async pendingTopups(): Promise<(TopupResponse & {customer: PendingTopupRow['profiles']; ageHours: number})[]> {
    return this.guarded(async () => {
      const now = Date.now();
      return (await this.repository.pendingTopups()).map((row) => ({
        ...toTopup(row), customer: row.profiles, ageHours: Math.max(0, (now - new Date(row.created_at).getTime()) / 3_600_000)
      }));
    }, 'pending topups read');
  }

  async confirmTopup(adminId: string, topupId: string, body: ConfirmTopupBody): Promise<{ok: true; already: boolean; paidOrderIds: string[]; bonusMinor: number}> {
    const result = await this.guarded(() => this.repository.confirmTopup({
      adminId, topupId, paidMinor: body.paidAmountMinor, txnRef: body.txnRef, note: body.note ?? null, acceptMismatch: body.acceptMismatch === true
    }), 'topup confirm');
    if (result?.ok !== true) throw refusal(result, 'Top-up not found');
    const paidOrderIds = Array.isArray(result.paid_order_ids) ? result.paid_order_ids.filter((id): id is string => typeof id === 'string') : [];
    // Best effort: a mail problem never undoes a confirmed payment.
    for (const orderId of paidOrderIds) {
      try {
        await this.notifications?.paymentConfirmed(orderId);
      } catch {
        this.logger.error('payment confirmation email failed');
      }
    }
    return {ok: true, already: result.already === true, paidOrderIds, bonusMinor: num(result.bonus_minor)};
  }

  async rejectTopup(adminId: string, topupId: string, body: RejectTopupBody): Promise<{ok: true}> {
    const result = await this.guarded(() => this.repository.rejectTopup(adminId, topupId, body.reason), 'topup reject');
    if (result?.ok !== true) throw refusal(result, 'Top-up not found');
    return {ok: true};
  }

  async adjustCredit(adminId: string, body: AdjustCreditBody): Promise<{ok: true; balanceMinor: number}> {
    const result = await this.guarded(() => this.repository.adjustCredit(adminId, body.userId, body.deltaMinor, body.note), 'credit adjust');
    if (result?.ok !== true) throw refusal(result, 'Customer not found');
    return {ok: true, balanceMinor: num(result.balance_minor)};
  }

  async refundToBalance(adminId: string, orderId: string, body: RefundToBalanceBody): Promise<{ok: true; already: boolean; refundedMinor: number}> {
    const result = await this.guarded(() => this.repository.refundToBalance(adminId, orderId, body.note), 'refund to balance');
    if (result?.ok !== true) throw refusal(result, 'Order not found');
    return {ok: true, already: result.already === true, refundedMinor: num(result.refunded_minor)};
  }
}

