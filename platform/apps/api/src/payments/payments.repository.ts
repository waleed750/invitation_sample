import {Injectable} from '@nestjs/common';
import {firstJson, type JsonRow} from '../common/db-rows';
import {DbService} from '../database';

export interface PaymentOrderDbRow {
  id: string;
  amount_minor: number;
  currency: string;
  status: string;
  user_id: string | null;
}

/**
 * Data access for payments. Webhooks carry no user, so every method here
 * runs as the service role (hence the `AsServiceRole` suffix).
 */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly db: DbService) {}

  /** Order by id (service role), or `null`. */
  async findOrderByIdAsServiceRole(orderId: string): Promise<PaymentOrderDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<PaymentOrderDbRow>[]>`
        select to_jsonb(o) as r from (
          select id, amount_minor, currency, status, user_id from public.orders where id = ${orderId}::uuid
        ) o`));
  }

  /** Order by provider reference (service role), or `null`. */
  async findOrderByProviderRefAsServiceRole(providerRef: string): Promise<PaymentOrderDbRow | null> {
    return this.db.asService(async (tx) =>
      firstJson(await tx<JsonRow<PaymentOrderDbRow>[]>`
        select to_jsonb(o) as r from (
          select id, amount_minor, currency, status, user_id from public.orders where provider_ref = ${providerRef}::text
          limit 1
        ) o`));
  }

  /** Fulfils a paid order through the `fulfill_paid_order` RPC (service role). */
  async fulfillPaidOrderAsServiceRole(orderId: string): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`select public.fulfill_paid_order(${orderId}::uuid) as result`;
    });
  }

  /** Marks a still-pending order as failed (service role). */
  async markOrderFailedAsServiceRole(orderId: string): Promise<void> {
    await this.db.asService(async (tx) => {
      await tx`update public.orders set status = 'failed' where id = ${orderId}::uuid and status = 'pending'`;
    });
  }
}
