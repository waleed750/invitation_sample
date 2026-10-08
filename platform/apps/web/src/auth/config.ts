// NEXT_PUBLIC_* vars must be referenced literally so Next inlines them in client bundles.
export function getSupabaseConfig(): {url: string; anonKey: string} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? {url, anonKey} : null;
}

export function isAuthConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function isApiCommerceMode(): boolean {
  return process.env.COMMERCE_MODE === 'api';
}
