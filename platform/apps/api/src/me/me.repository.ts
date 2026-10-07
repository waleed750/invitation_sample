import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

const PROFILE_COLUMNS = 'id,name,preferred_locale,role,level,purchases_count,points_balance';

/** Data access for the caller's own profile. The only file here that talks to Supabase. */
@Injectable()
export class MeRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Caller's profile row (user JWT, RLS applies). Raw postgrest envelope. */
  async findProfile(jwt: string, userId: string): Promise<unknown> {
    return this.supabase.forUser(jwt).from('profiles').select(PROFILE_COLUMNS).eq('id', userId).single();
  }

  /** Updates the caller's preferred locale and returns the updated row (user JWT, RLS applies). */
  async updatePreferredLocale(jwt: string, userId: string, locale: 'ar' | 'en'): Promise<unknown> {
    return this.supabase.forUser(jwt).from('profiles').update({preferred_locale: locale}).eq('id', userId)
      .select(PROFILE_COLUMNS).single();
  }
}
