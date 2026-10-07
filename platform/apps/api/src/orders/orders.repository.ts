import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

const COLUMNS = 'id,template_id,tier,kind,amount_egp,status,provider,provider_ref,discount_total,points_redeemed,created_at,paid_at';

/** Data access for the caller's orders. The only file here that talks to Supabase. */
@Injectable()
export class OrdersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Owner's orders, newest first (user JWT, RLS applies). Raw postgrest envelope. */
  async listByUser(jwt: string, userId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('orders').select(COLUMNS)
      .eq('user_id', userId).order('created_at', {ascending: false});
  }

  /** One of the owner's orders (user JWT, RLS applies). Raw postgrest envelope. */
  async findByIdForUser(jwt: string, userId: string, orderId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('orders').select(COLUMNS)
      .eq('id', orderId).eq('user_id', userId).single();
  }
}
