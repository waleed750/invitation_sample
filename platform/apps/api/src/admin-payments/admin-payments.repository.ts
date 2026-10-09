import {Injectable} from '@nestjs/common';
import {allJson, rpcObject, type JsonRow, type RpcObject, type RpcRow} from '../common/db-rows';
import {DbService} from '../database';

export interface ConfirmManualPaymentInput {
  orderId: string;
  adminId: string;
  paidAmountMinor: number;
  txnRef: string;
  note: string | null;
  acceptMismatch: boolean;
}

export interface PendingManualOrderDbRow {
  id: string;
  provider_ref: string | null;
  amount_minor: number;
  currency: string;
  created_at: string;
  /** Embedded customer profile; `null` when the order has no user. */
  profiles: {id: string; name: string | null; phone: string | null; email: string | null} | null;
}

/**
 * Data access for the admin "Pending payments" screen. Admin actions are not
 * RLS-scoped to the caller, so every method runs as the service role; the
 * controller is `@Roles('admin')`.
 */
@Injectable()
export class AdminPaymentsRepository {
  constructor(private readonly db: DbService) {}

  /** Pending manual orders with their customer, newest first. */
  async listPendingManualOrdersAsServiceRole(): Promise<PendingManualOrderDbRow[]> {
    return this.db.asService(async (tx) =>
      allJson(await tx<JsonRow<PendingManualOrderDbRow>[]>`
        select to_jsonb(x) as r from (
          select o.id, o.provider_ref, o.amount_minor, o.currency, o.created_at,
            (select jsonb_build_object('id', p.id, 'name', p.name, 'phone', p.phone, 'email', p.email)
             from public.profiles p where p.id = o.user_id) as profiles
          from public.orders o where o.provider = 'manual' and o.status = 'pending'
        ) x order by x.created_at desc`));
  }

  /** `admin_confirm_manual_payment` RPC (service role only in SQL). */
  async confirmManualPaymentAsServiceRole(input: ConfirmManualPaymentInput): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_confirm_manual_payment(
          ${input.orderId}::uuid,
          ${input.adminId}::uuid,
          ${input.paidAmountMinor}::bigint,
          ${input.txnRef}::text,
          ${input.note}::text,
          ${input.acceptMismatch}::boolean
        ) as result`));
  }

  /** `admin_reject_manual_payment` RPC (service role only in SQL). */
  async rejectManualPaymentAsServiceRole(orderId: string, adminId: string, reason: string): Promise<RpcObject | null> {
    return this.db.asService(async (tx) =>
      rpcObject(await tx<RpcRow<unknown>[]>`
        select public.admin_reject_manual_payment(${orderId}::uuid, ${adminId}::uuid, ${reason}::text) as result`));
  }
}
