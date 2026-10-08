'use server';

import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from './supabase-server';

export async function signOutAuthAction(locale: string) {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect(locale === 'en' ? '/en' : '/ar');
}
