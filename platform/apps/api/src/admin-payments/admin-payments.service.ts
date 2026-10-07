import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {AdminPaymentsRepository} from './admin-payments.repository';

const orderParams = z.object({orderId: z.uuid('order id must be a UUID')});
export class AdminOrderParams extends createZodDto(orderParams) {}

const confirmSchema = z.object({
  paidAmountMinor: z.number().int().min(0),
  txnRef: z.string().trim().min(1).max(120),
  note: z.string().trim().max(500).optional(),
  acceptMismatch: z.boolean().optional()
}).strict();
export class ConfirmPaymentBody extends createZodDto(confirmSchema) {}

const rejectSchema = z.object({reason: z.string().trim().min(3).max(500)}).strict();
export class RejectPaymentBody extends createZodDto(rejectSchema) {}

export interface PendingPaymentResponse {
  id: string;
  reference: string | null;
  amountMinor: number;
  currency: string;
  createdAt: string;
  ageHours: number;
  customer: {id: string | null; name: string | null; phone: string | null; email: string | null};
}

export interface ConfirmPaymentResponse {
  ok: true;
  /** True when the order was already paid: nothing was written. */
  already: boolean;
}

export interface RejectPaymentResponse {
  ok: true;
}

const HOUR_MS = 3_600_000;

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly repository: AdminPaymentsRepository,
    private readonly logger: AppLogger
  ) {}

  async listPending(): Promise<PendingPaymentResponse[]> {
    const result: unknown = await this.repository.listPendingManualOrdersAsServiceRole();
    if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) {
      this.logger.error('admin pending payments query failed');
      throw new ServiceUnavailableException('Payments service unavailable');
    }
    const now = Date.now();
    return result.data.map((row: unknown) => this.toPending(row, now));
  }

  async confirm(adminId: string, orderId: string, body: ConfirmPaymentBody): Promise<ConfirmPaymentResponse> {
    const data = await this.rpc(() => this.repository.confirmManualPaymentAsServiceRole({
      orderId,
      adminId,
      paidAmountMinor: body.paidAmountMinor,
      txnRef: body.txnRef,
      note: body.note === undefined || body.note === '' ? null : body.note,
      acceptMismatch: body.acceptMismatch ?? false
    }), 'confirm');
    if (data.ok === true) return {ok: true, already: data.already === true};
    throw this.failure(data);
  }

  async reject(adminId: string, orderId: string, body: RejectPaymentBody): Promise<RejectPaymentResponse> {
    const data = await this.rpc(() => this.repository.rejectManualPaymentAsServiceRole(orderId, adminId, body.reason), 'reject');
    if (data.ok === true) return {ok: true};
    throw this.failure(data);
  }

  private async rpc(call: () => Promise<unknown>, label: string): Promise<Record<string, unknown>> {
    let result: unknown;
    try {
      result = await call();
    } catch {
      this.logger.error(`admin payment ${label} failed`);
      throw new ServiceUnavailableException('Payments service unavailable');
    }
    if (!isRecord(result) || result.error !== null || !isRecord(result.data)) {
      this.logger.error(`admin payment ${label} rpc failed`);
      throw new ServiceUnavailableException('Payments service unavailable');
    }
    return result.data;
  }

  /** Maps a `{ok:false, reason}` SQL result to a stable HTTP error code. */
  private failure(data: Record<string, unknown>): Error {
    switch (data.reason) {
      case 'amount_mismatch':
        return new ConflictException({code: 'amount_mismatch', message: 'The amount received differs from the order amount; accept the mismatch explicitly'});
      case 'note_required':
        return new ConflictException({code: 'note_required', message: 'A note is required to accept an amount mismatch'});
      case 'not_pending':
        return new ConflictException({code: 'not_pending', message: 'The order is not pending'});
      case 'not_manual':
        return new ConflictException({code: 'not_manual', message: 'The order was not paid through manual payment'});
      case 'invalid_amount':
        return new BadRequestException({code: 'invalid_amount', message: 'Invalid paid amount'});
      case 'not_found':
        return new NotFoundException('Order not found');
      default:
        this.logger.error('admin payment returned an unknown reason');
        return new ServiceUnavailableException('Payments service unavailable');
    }
  }

  private toPending(row: unknown, now: number): PendingPaymentResponse {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.created_at !== 'string' || typeof row.currency !== 'string') {
      throw new ServiceUnavailableException('Payments service unavailable');
    }
    const amount = Number(row.amount_minor);
    const created = Date.parse(row.created_at);
    if (!Number.isSafeInteger(amount) || Number.isNaN(created)) throw new ServiceUnavailableException('Payments service unavailable');
    const embedded: unknown = row.profiles;
    const profile: unknown = Array.isArray(embedded) ? (embedded[0] as unknown) : embedded;
    const customer = isRecord(profile) ? profile : {};
    return {
      id: row.id,
      reference: text(row.provider_ref),
      amountMinor: amount,
      currency: row.currency,
      createdAt: row.created_at,
      ageHours: Math.max(0, Math.floor((now - created) / HOUR_MS)),
      customer: {id: text(customer.id), name: text(customer.name), phone: text(customer.phone), email: text(customer.email)}
    };
  }
}
