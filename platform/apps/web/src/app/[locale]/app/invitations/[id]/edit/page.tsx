import '@/styles/editor.css';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound, redirect} from 'next/navigation';
import {BalanceApiError, apiCall} from '@/balance/server';
import {NotSignedInError} from '@/commerce/api-errors';
import {Editor} from '@/editor/Editor';
import {editorPropsFor, type InvitationDetail} from '@/editor/build-props';
import {routing} from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function EditPage({params}: {params: Promise<{locale: string; id: string}>}) {
  const {locale, id} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  let detail: InvitationDetail;
  try {
    detail = await apiCall<InvitationDetail>('GET', `/v1/invitations/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof NotSignedInError) redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/app/invitations/${id}/edit`)}`);
    if (error instanceof BalanceApiError && error.status === 404) notFound();
    throw error;
  }

  const props = editorPropsFor(detail, locale as 'ar' | 'en');
  if (props === null) notFound();
  return <Editor {...props} />;
}
