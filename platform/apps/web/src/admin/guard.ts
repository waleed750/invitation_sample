import {notFound, redirect} from 'next/navigation';
import {headers} from 'next/headers';
import {isApiCommerceMode, isAuthConfigured} from '../auth/config';
import {getServerSession, type AuthSession} from '../auth/session';

/**
 * Pure decision function for easier testing.
 */
export function decideAdminAccess(
  isConfigured: boolean,
  isApiMode: boolean,
  session: AuthSession | null,
  role: string | undefined,
  locale: string,
  pathname: string,
): {action: 'allow'} | {action: 'not-found'} | {action: 'redirect'; url: string} {
  if (!isConfigured || !isApiMode) return {action: 'not-found'};
  if (!session) {
    const nextUrl = new URL(`/${locale}/sign-in`, 'http://localhost'); // dummy origin
    nextUrl.searchParams.set('next', pathname);
    return {action: 'redirect', url: nextUrl.pathname + nextUrl.search};
  }
  if (role !== 'admin') return {action: 'not-found'};
  return {action: 'allow'};
}

export async function requireAdmin(locale: string): Promise<void> {
  const isConfigured = isAuthConfigured();
  const isApiMode = isApiCommerceMode();
  const session = await getServerSession();
  
  let role: string | undefined;
  if (isConfigured && isApiMode && session) {
    const baseUrl = process.env.API_BASE_URL?.replace(/\/+$/, '') ?? '';
    try {
      const res = await fetch(`${baseUrl}/v1/me`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        // In Next.js App Router, fetch must not cache per-user auth queries globally
        cache: 'no-store'
      });
      if (res.ok) {
        const body = await res.json();
        role = body.role;
      }
    } catch {
      // ignore
    }
  }

  const reqHeaders = await headers();
  // In Next.js App Router, headers() doesn't expose pathname easily if middleware hasn't passed it,
  // but we can use x-url or just fallback to /admin
  const pathname = reqHeaders.get('x-invoke-path') || `/${locale}/admin`;

  const decision = decideAdminAccess(isConfigured, isApiMode, session, role, locale, pathname);

  if (decision.action === 'not-found') {
    notFound();
  } else if (decision.action === 'redirect') {
    redirect(decision.url);
  }
}
