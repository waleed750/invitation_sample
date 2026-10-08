import {createServerClient} from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';
import {getSupabaseConfig, isApiCommerceMode} from './auth/config';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const DASHBOARD_PATH = /^\/(ar|en)\/app(\/|$)/;

export default async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  // The OAuth callback lives outside the locale tree.
  if (pathname.startsWith('/auth/')) return NextResponse.next();

  const response = intlMiddleware(request);
  const config = getSupabaseConfig();
  if (!config) return response;

  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
  const gated = isApiCommerceMode() && DASHBOARD_PATH.test(pathname);
  if (!hasAuthCookie) return gated ? redirectToSignIn(request, response) : response;

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({name, value, options}) => response.cookies.set(name, value, options));
      }
    }
  });
  // Refreshes the session and rewrites cookies onto the response.
  const {data: {user}} = await supabase.auth.getUser();
  if (gated && !user) return redirectToSignIn(request, response);
  return response;
}

function redirectToSignIn(request: NextRequest, intlResponse: NextResponse) {
  const {pathname, search} = request.nextUrl;
  const locale = pathname.split('/')[1];
  const url = new URL(`/${locale}/sign-in`, request.url);
  url.searchParams.set('next', pathname + search);
  const redirect = NextResponse.redirect(url);
  intlResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']};
