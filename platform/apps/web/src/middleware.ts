import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';
import {isApiCommerceMode} from './auth/config';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const GATED_PATHS = /^\/(ar|en)\/(app|admin)(\/|$)/;

export default async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  
  if (pathname.startsWith('/auth/')) return NextResponse.next();

  const response = intlMiddleware(request);

  const gated = isApiCommerceMode() && GATED_PATHS.test(pathname);
  if (!gated) return response;

  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('better-auth.session_token') || c.name.startsWith('auth.session_token'));
  
  if (!hasAuthCookie) return redirectToSignIn(request, response);

  return response;
}

function redirectToSignIn(request: NextRequest, intlResponse: NextResponse) {
  const {pathname, search} = request.nextUrl;
  const locale = pathname.split('/')[1] || 'ar';
  const url = new URL(`/${locale}/sign-in`, request.url);
  url.searchParams.set('next', pathname + search);
  const redirect = NextResponse.redirect(url);
  intlResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']};
