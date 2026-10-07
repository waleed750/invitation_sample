import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for the auth module. The only file here that talks to Supabase. */
@Injectable()
export class AuthRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Caller's `profiles.role` row, read with the caller's JWT (RLS applies). Raw postgrest envelope. */
  async findRoleByUserId(jwt: string, userId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('profiles').select('role').eq('id', userId).single();
  }
}
