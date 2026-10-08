import {createBrowserClient} from '@supabase/ssr';
import {getSupabaseConfig} from './config';

/** Returns null when Supabase env is not configured. */
export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  return config ? createBrowserClient(config.url, config.anonKey) : null;
}
