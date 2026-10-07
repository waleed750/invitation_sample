import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

export interface ConfirmManualPaymentInput {
  orderId: string;
  adminId: string;
  paidAmountMinor: number;
  txnRef: string;
  note: string | null;
  acceptMismatch: boolean;
}

/**
 * Data access for the admin "Pending payments" screen. Admin actions are not
 * RLS-scoped to the caller, so every method uses the service-role client; the
 * controller is `@Roles('admin')`.
 */
@Injectable()
export class AdminPaymentsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Pending manual orders with their customer, newest first. Raw postgrest envelope. */
  async listPendingManualOrdersAsServiceRole(): Promise<unknown> {
    return this.supabase.admin().from('orders')
      .select('id,provider_ref,amount_minor,currency,created_at,profiles(id,name,phone,email)')
      .eq('provider', 'manual').eq('status', 'pending')
      .order('created_at', {ascending: false});
  }

  /** `admin_confirm_manual_payment` RPC (service role only in SQL). */
  async confirmManualPaymentAsServiceRole(input: ConfirmManualPaymentInput): Promise<unknown> {
    return this.supabase.admin().rpc('admin_confirm_manual_payment', {
      p_order_id: input.orderId,
      p_admin_id: input.adminId,
      p_paid_amount_minor: input.paidAmountMinor,
      p_txn_ref: input.txnRef,
      p_note: input.note,
      p_accept_mismatch: input.acceptMismatch
    });
  }

  /** `admin_reject_manual_payment` RPC (service role only in SQL). */
  async rejectManualPaymentAsServiceRole(orderId: string, adminId: string, reason: string): Promise<unknown> {
    return this.supabase.admin().rpc('admin_reject_manual_payment', {
      p_order_id: orderId,
      p_admin_id: adminId,
      p_reason: reason
    });
  }
}
