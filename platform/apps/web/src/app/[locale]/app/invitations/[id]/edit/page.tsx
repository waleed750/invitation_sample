import '@/styles/editor.css';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound, redirect} from 'next/navigation';
import {fromDbTier, invitationDocument, planRules, TIERS, type InvitationDocument, type SectionType} from '@platform/shared';
import {BalanceApiError, apiCall} from '@/balance/server';
import {NotSignedInError} from '@/commerce/api-errors';
import {Editor} from '@/editor/Editor';
import {startingDocument} from '@/editor/initial-document';
import {routing} from '@/i18n/routing';
import {getTemplateAny} from '@/templates/registry';

export const dynamic = 'force-dynamic';

interface InvitationDetail {
  id: string;
  slug: string;
  status: string;
  templateSlug: string | null;
  document: unknown;
  tier: string | null;
  updatedAt: string;
  publishedAt: string | null;
  entitlement: {remaining: number; onlineUntil: string | null; canPublish: {ok: boolean; reason?: string}};
}

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

  const template = detail.templateSlug === null ? null : getTemplateAny(detail.templateSlug);
  if (!template) notFound();
  const stored = invitationDocument.safeParse(detail.document);
  const tier = fromDbTier(detail.tier ?? 'save_the_date');
  const document: InvitationDocument | null = startingDocument(stored.success ? stored.data : null, template.getData(), tier);
  if (document === null) notFound();

  const rules = planRules(tier);
  const plan = TIERS[tier];
  const verdict = detail.entitlement.canPublish;

  return (
    <Editor
      invitationId={detail.id}
      templateSlug={detail.templateSlug as string}
      locale={locale as 'ar' | 'en'}
      initialDocument={document}
      version={detail.updatedAt}
      allowedTypes={[...rules.allowedSectionTypes] as SectionType[]}
      maxSections={rules.maxSections}
      remaining={detail.entitlement.remaining}
      expired={!verdict.ok && verdict.reason === 'expired'}
      published={detail.publishedAt !== null}
      slug={detail.slug}
      canMusic={plan.musicUpload}
      canVideo={plan.videoIntro}
    />
  );
}
