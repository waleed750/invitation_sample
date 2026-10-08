import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {getSupabaseConfig} from './config';

/** Returns null when Supabase env is not configured. */
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(items) {
        try {
          items.forEach(({name, value, options}) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: middleware refreshes the cookies instead.
        }
      }
    }
  });
}
