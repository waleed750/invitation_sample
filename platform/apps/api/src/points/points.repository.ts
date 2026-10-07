import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for points. The only file here that talks to Supabase. */
@Injectable()
export class PointsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Caller's balance + purchase count (user JWT, RLS applies). Raw postgrest envelope. */
  async findBalance(jwt: string, userId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('profiles').select('points_balance,purchases_count').eq('id', userId).single();
  }

  /** Caller's 50 most recent ledger rows (user JWT, RLS applies). Raw postgrest envelope. */
  async listLedger(jwt: string, userId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('points_ledger')
      .select('id,order_id,delta,reason,created_at,expires_at').eq('user_id', userId)
      .order('created_at', {ascending: false}).limit(50);
  }
}
