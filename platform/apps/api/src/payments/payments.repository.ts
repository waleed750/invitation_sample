import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

const ORDER_COLUMNS = 'id,amount_minor,currency,status,user_id';

/**
 * Data access for payments. Webhooks carry no user JWT, so every method here
 * uses the service-role client (hence the `AsServiceRole` suffix).
 */
@Injectable()
export class PaymentsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Order by id (service role). Raw postgrest envelope. */
  async findOrderByIdAsServiceRole(orderId: string): Promise<unknown> {
    return this.supabase.admin().from('orders').select(ORDER_COLUMNS).eq('id', orderId).single();
  }

  /** Order by provider reference (service role). Raw postgrest envelope. */
  async findOrderByProviderRefAsServiceRole(providerRef: string): Promise<unknown> {
    return this.supabase.admin().from('orders').select(ORDER_COLUMNS).eq('provider_ref', providerRef).single();
  }

  /** Fulfils a paid order through the `fulfill_paid_order` RPC (service role). */
  async fulfillPaidOrderAsServiceRole(orderId: string): Promise<unknown> {
    return this.supabase.admin().rpc('fulfill_paid_order', {p_order_id: orderId});
  }

  /** Marks a still-pending order as failed (service role). */
  async markOrderFailedAsServiceRole(orderId: string): Promise<unknown> {
    return this.supabase.admin().from('orders').update({status: 'failed'}).eq('id', orderId).eq('status', 'pending');
  }
}
