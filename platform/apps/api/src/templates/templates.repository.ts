import {Injectable} from '@nestjs/common';
import {SupabaseService} from '../supabase/supabase.service';

/** Data access for the template catalog. The only file here that talks to Supabase. */
@Injectable()
export class TemplatesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /** Live templates in catalog order (anonymous client, RLS applies). Raw postgrest envelope. */
  async listLive(): Promise<unknown> {
    return this.supabase.public().from('templates')
      .select('slug,name,tagline,tier,price_override_egp,status,featured')
      .eq('status', 'live')
      .order('sort_order', {ascending: true});
  }
}
