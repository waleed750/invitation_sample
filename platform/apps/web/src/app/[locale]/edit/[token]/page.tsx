import '@/styles/editor.css';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound, redirect} from 'next/navigation';
import {BalanceApiError, apiCall} from '@/balance/server';
import {getServerSession} from '@/auth/session';
import {Editor} from '@/editor/Editor';
import {editorPropsFor, type InvitationDetail} from '@/editor/build-props';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

function base(): string {
  const url = process.env.API_BASE_URL;
  if (!url) throw new Error('API_BASE_URL is required when COMMERCE_MODE=api');
  return url.replace(/\/+$/, '');
}

/** Asks the API which invitation a private link opens (nothing is revealed for a bad link). */
async function resolve(token: string): Promise<string | null> {
  const response = await fetch(`${base()}/v1/edit-links/resolve`, {
    method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({token}), cache: 'no-store',
  }).catch(() => null);
  if (response === null || !response.ok) return null;
  const body = (await response.json()) as {invitationId?: unknown};
  return typeof body.invitationId === 'string' ? body.invitationId : null;
}

/**
 * `/ar/edit/<token>`: the private editing link an admin sends to a customer. No sign-in: the secret in the URL is the key,
 * and it opens this one invitation only. `?claim=1` (after signing in) moves the invitation into the customer's own account.
 */
export default async function PrivateEditPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string; token: string}>;
  searchParams: Promise<{claim?: string}>;
}) {
  const {locale, token} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const {claim} = await searchParams;
  const lang = locale as 'ar' | 'en';
  const t = await getTranslations('editor.privateLink');

  const invalid = (
    <main className="ed-private-invalid" data-testid="edit-link-invalid">
      <h1>{t('invalidTitle')}</h1>
      <p>{t('invalidBody')}</p>
      <Link href="/">{t('home')}</Link>
    </main>
  );
  if (!TOKEN.test(token)) return invalid;
  const invitationId = await resolve(token);
  if (invitationId === null) return invalid;

  if (claim === '1') {
    if (!(await getServerSession())) redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/edit/${token}?claim=1`)}`);
    try {
      await apiCall('POST', `/v1/invitations/${encodeURIComponent(invitationId)}/claim`, {token});
    } catch (error) {
      if (!(error instanceof BalanceApiError)) throw error;
      return invalid;
    }
    redirect(`/${locale}/app/invitations/${invitationId}/edit`);
  }

  const response = await fetch(`${base()}/v1/invitations/${encodeURIComponent(invitationId)}`, {
    cache: 'no-store', headers: {'x-edit-token': token},
  }).catch(() => null);
  if (response === null || !response.ok) return invalid;
  const props = editorPropsFor((await response.json()) as InvitationDetail, lang);
  if (props === null) notFound();
  return <Editor {...props} editToken={token} />;
}
