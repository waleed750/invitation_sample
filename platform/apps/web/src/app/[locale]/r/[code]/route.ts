import {NextResponse} from 'next/server';
import {REF_COOKIE} from '@/commerce/ref';

export const dynamic = 'force-dynamic';

const CODE = /^[a-z0-9_-]{3,32}$/;
const THIRTY_DAYS = 30 * 24 * 60 * 60;

/**
 * A partner link (`/ar/r/mona10`). It remembers the partner for 30 days (a cookie holding the code and the click time),
 * counts the visit without storing anything about the visitor, then opens the home page.
 */
export async function GET(request: Request, {params}: {params: Promise<{locale: string; code: string}>}): Promise<Response> {
  const {locale, code: raw} = await params;
  const code = raw.toLowerCase();
  const target = new URL(locale === 'en' ? '/en' : '/ar', request.url);
  const response = NextResponse.redirect(target, 302);
  if (!CODE.test(code)) return response;

  response.cookies.set(REF_COOKIE, `${code}.${Math.floor(Date.now() / 1000)}`, {
    maxAge: THIRTY_DAYS, httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', path: '/',
  });
  const api = process.env.API_BASE_URL?.replace(/\/+$/, '');
  if (api) {
    try {
      await fetch(`${api}/v1/affiliates/click`, {
        method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({ref: code, path: `/${locale}`}), cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // Counting is best effort; the redirect and the cookie still work.
    }
  }
  return response;
}
