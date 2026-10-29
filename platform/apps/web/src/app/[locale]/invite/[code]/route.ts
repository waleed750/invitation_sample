import {NextResponse} from 'next/server';
import {FRIEND_CODE, FRIEND_COOKIE} from '@/commerce/ref';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, {params}: {params: Promise<{locale: string; code: string}>}): Promise<Response> {
  const {locale, code} = await params;
  const response = NextResponse.redirect(new URL(locale === 'en' ? '/en' : '/ar', request.url), 302);
  if (FRIEND_CODE.test(code)) {
    response.cookies.set(FRIEND_COOKIE, code, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(request.url).protocol === 'https:',
      path: '/',
    });
  }
  return response;
}
