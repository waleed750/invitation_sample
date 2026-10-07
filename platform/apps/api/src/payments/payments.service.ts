import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {PaymentsRepository} from './payments.repository';
import {MockPaymentProvider} from './mock-payment.provider';
import {PAYMENT_PROVIDER, type PaymentProvider, type PaymentStatus} from './payment-provider';

interface OrderRow {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  userId: string | null;
}

function orderRow(value: unknown): OrderRow {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.status !== 'string') {
    throw new ServiceUnavailableException('Payment service unavailable');
  }
  // bigint columns arrive as JSON numbers from PostgREST; tolerate numeric strings.
  const amount = typeof value.amount_minor === 'number' ? value.amount_minor : Number(value.amount_minor);
  if (!Number.isSafeInteger(amount) || typeof value.currency !== 'string') throw new ServiceUnavailableException('Payment service unavailable');
  return {id: value.id, amountMinor: amount, currency: value.currency, status: value.status, userId: typeof value.user_id === 'string' ? value.user_id : null};
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly mockProvider: MockPaymentProvider,
    private readonly repository: PaymentsRepository,
    private readonly logger: AppLogger
  ) {}

  async handleWebhook(
    providerName: string,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ok: true}> {
    if (providerName !== 'mock') throw new NotFoundException('Payment provider not found');
    const event = await this.provider.verifyWebhook(rawBody, headers);
    const order = await this.findOrder(event.providerRef);
    if (order.amountMinor !== event.amountMinor || order.currency !== event.currency) {
      this.logger.error(`payment amount mismatch for order ${order.id}`);
      throw new ConflictException('Payment amount mismatch');
    }
    await this.applyStatus(order, event.status);
    return {ok: true};
  }

  async simulate(orderId: string, status: Extract<PaymentStatus, 'paid' | 'failed'>, userId: string): Promise<{ok: true}> {
    const order = await this.findOrderById(orderId);
    // Dev-only shortcut: callers may only settle their own orders (404, never reveal others' ids).
    if (order.userId !== userId) throw new NotFoundException('Order not found');
    const rawBody = Buffer.from(JSON.stringify({
      providerRef: `mock_${order.id}`,
      status,
      amountMinor: order.amountMinor,
      currency: order.currency
    }));
    return this.handleWebhook('mock', rawBody, {'x-mock-signature': this.mockProvider.sign(rawBody)});
  }

  private async findOrder(providerRef: string): Promise<OrderRow> {
    return this.lookup(() => this.repository.findOrderByProviderRefAsServiceRole(providerRef));
  }

  private async findOrderById(id: string): Promise<OrderRow> {
    return this.lookup(() => this.repository.findOrderByIdAsServiceRole(id));
  }

  private async lookup(query: () => Promise<unknown>): Promise<OrderRow> {
    try {
      const result: unknown = await query();
      if (!isRecord(result)) throw new ServiceUnavailableException('Payment service unavailable');
      const {data, error}: {data: unknown; error: unknown} = result as {data: unknown; error: unknown};
      if (error !== null) {
        if (isRecord(error) && error.code === 'PGRST116') throw new NotFoundException('Order not found');
        throw new ServiceUnavailableException('Payment service unavailable');
      }
      return orderRow(data);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('payment order lookup failed');
      throw new ServiceUnavailableException('Payment service unavailable');
    }
  }

  private async applyStatus(order: OrderRow, status: PaymentStatus): Promise<void> {
    if (status === 'pending' || order.status !== 'pending') return;
    try {
      const result: unknown = status === 'paid'
        ? await this.repository.fulfillPaidOrderAsServiceRole(order.id)
        : await this.repository.markOrderFailedAsServiceRole(order.id);
      if (!isRecord(result) || result.error !== null) throw new ServiceUnavailableException('Payment service unavailable');
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('payment fulfillment failed');
      throw new ServiceUnavailableException('Payment service unavailable');
    }
  }
}
