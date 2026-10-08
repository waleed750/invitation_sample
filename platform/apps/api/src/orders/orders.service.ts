import {Injectable, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {fromDbTier} from '@platform/shared';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {AppConfigService} from '../config/app-config.service';
import {buildManualPayment, type ManualPaymentDetails} from '../payments/manual-payment';
import {OrdersRepository} from './orders.repository';

const orderId = z.object({id: z.uuid('order id must be a UUID')});
export class OrderIdParams extends createZodDto(orderId) {}

export interface OrderResponse {
  id: string;
  templateId: string | null;
  templateSlug: string | null;
  tier: string;
  kind: string;
  amountMinor: number;
  currency: string;
  status: string;
  provider: string;
  reference?: string;
  discountTotalMinor: number;
  pointsRedeemed: number;
  createdAt: string;
  paidAt?: string;
  /** Manual-provider orders only: how to pay, quoting the reference. */
  payment?: ManualPaymentDetails;
}

function minorValue(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function relation(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && isRecord(value[0])) return value[0];
  return null;
}

function toResponse(value: unknown, config: AppConfigService): OrderResponse {
  if (!isRecord(value)) throw new ServiceUnavailableException('Orders service unavailable');
  const amount = minorValue(value.amount_minor);
  const discount = minorValue(value.discount_total_minor);
  if (
    typeof value.id !== 'string' || !(typeof value.template_id === 'string' || value.template_id === null) ||
    typeof value.tier !== 'string' || typeof value.kind !== 'string' || amount === null || typeof value.currency !== 'string' ||
    typeof value.status !== 'string' || typeof value.provider !== 'string' || discount === null ||
    typeof value.points_redeemed !== 'number' || typeof value.created_at !== 'string' ||
    !(typeof value.provider_ref === 'string' || value.provider_ref === null) ||
    !(typeof value.paid_at === 'string' || value.paid_at === null)
  ) throw new ServiceUnavailableException('Orders service unavailable');
  const template = relation(value.template);
  return {
    id: value.id,
    templateId: value.template_id,
    templateSlug: template !== null && typeof template.slug === 'string' ? template.slug : null,
    tier: fromDbTier(value.tier),
    kind: value.kind,
    amountMinor: amount,
    currency: value.currency,
    status: value.status,
    provider: value.provider,
    ...(value.provider_ref === null ? {} : {reference: value.provider_ref}),
    discountTotalMinor: discount,
    pointsRedeemed: value.points_redeemed,
    createdAt: value.created_at,
    ...(value.paid_at === null ? {} : {paidAt: value.paid_at}),
    ...(value.provider === 'manual' && value.provider_ref !== null ? {payment: buildManualPayment({
      reference: value.provider_ref,
      amountMinor: amount,
      currency: value.currency,
      createdAt: value.created_at,
      ...(config.manualPaymentInstructions === undefined ? {} : {instructions: config.manualPaymentInstructions})
    })} : {})
  };
}

@Injectable()
export class OrdersService {
  constructor(private readonly repository: OrdersRepository, private readonly logger: AppLogger, private readonly config: AppConfigService) {}

  async list(user: RequestUser): Promise<OrderResponse[]> {
    try {
      const result: unknown = await this.repository.listByUser(user.jwt, user.id);
      if (!isRecord(result) || result.error !== null || !Array.isArray(result.data)) throw new ServiceUnavailableException('Orders service unavailable');
      return result.data.map((row: unknown) => toResponse(row, this.config));
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('orders lookup failed');
      throw new ServiceUnavailableException('Orders service unavailable');
    }
  }

  async get(user: RequestUser, id: string): Promise<OrderResponse> {
    try {
      const result: unknown = await this.repository.findByIdForUser(user.jwt, user.id, id);
      if (!isRecord(result)) throw new ServiceUnavailableException('Orders service unavailable');
      if (result.error !== null) {
        if (isRecord(result.error) && result.error.code === 'PGRST116') throw new NotFoundException('Order not found');
        throw new ServiceUnavailableException('Orders service unavailable');
      }
      return toResponse(result.data, this.config);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('order lookup failed');
      throw new ServiceUnavailableException('Orders service unavailable');
    }
  }
}
