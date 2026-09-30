import {Injectable} from '@nestjs/common';
import {createClient} from '@supabase/supabase-js';
import {AppConfigService} from '../config/app-config.service';

/**
 * `fetch` with a hard per-request timeout. Aborts when the timeout elapses,
 * or when the caller's own signal fires — whichever comes first. Passed as
 * `global.fetch` so it covers every Supabase sub-client (db, auth, storage).
 */
function fetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const callerSignal: AbortSignal | undefined = init?.signal ?? undefined;
    const signal = callerSignal === undefined ? timeoutSignal : AbortSignal.any([callerSignal, timeoutSignal]);
    return fetch(input, {...init, signal});
  };
}

/**
 * The ONLY place Supabase clients are created. No other module may call
 * `createClient` directly. (Return types are inferred from `createClient` —
 * there are no hand-written generated table types yet.)
 *
 * Resilience contract (an outage must degrade to fast 503s, never hangs):
 * - `db.retry: false` — postgrest retries failed reads with 1s+2s+4s backoff
 *   by default, turning every authenticated request into a ~7s hang.
 * - `global.fetch` enforces `SUPABASE_TIMEOUT_MS` per call, so even a host
 *   that accepts connections but never responds fails fast.
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
    const timeoutMs = this.config.supabaseTimeoutMs;
    return createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      global: {headers: {Authorization: `Bearer ${jwt}`}, fetch: fetchWithTimeout(timeoutMs)},
      db: {retry: false},
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}
    });
  }

  admin() {
    const timeoutMs = this.config.supabaseTimeoutMs;
    return createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey, {
      global: {fetch: fetchWithTimeout(timeoutMs)},
      db: {retry: false},
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}
    });
  }
}
