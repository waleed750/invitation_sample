import {Injectable} from '@nestjs/common';
import {createClient} from '@supabase/supabase-js';
import {AppConfigService} from '../config/app-config.service';

/**
 * The ONLY place Supabase clients are created. No other module may call
 * `createClient` directly. (Return types are inferred from `createClient` —
 * there are no hand-written generated table types yet.)
 *
 * - `forUser(jwt)` builds a client that sends the caller's JWT, so Postgres
 *   RLS policies apply exactly as if the caller queried directly.
 * - `admin()` uses the service-role key (bypasses RLS). Server-side only:
 *   the key and anything fetched with it must never be returned to callers.
 */
@Injectable()
export class SupabaseService {
  constructor(private readonly config: AppConfigService) {}

  forUser(jwt: string) {
    return createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      global: {headers: {Authorization: `Bearer ${jwt}`}},
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}
    });
  }

  admin() {
    return createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey, {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}
    });
  }
}
