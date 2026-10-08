import {NextResponse, type NextRequest} from 'next/server';
import {localeOfPath, safeNextPath} from '@/auth/safe-next';
import {createSupabaseServerClient} from '@/auth/supabase-server';

export async function GET(request: NextRequest) {
  const {searchParams, origin} = request.nextUrl;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const locale = (rawNext && localeOfPath(rawNext)) || 'ar';
  const next = safeNextPath(rawNext, locale);
  const failure = NextResponse.redirect(new URL('/ar/sign-in?error=auth', origin));
  if (!code) return failure;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure;
  const {error} = await supabase.auth.exchangeCodeForSession(code);
  return error ? failure : NextResponse.redirect(new URL(next, origin));
}
