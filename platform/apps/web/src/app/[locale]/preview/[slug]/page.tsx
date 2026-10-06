import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {resolveText} from '@platform/shared';
import {getTemplateAny} from '@/templates/registry';
import InvitationShell from '@/engine/InvitationShell';
import '@/engine/styles/templates/mashrabiya.css';
import '@/engine/styles/templates/africa.css';
import '@/engine/styles/templates/citystars.css';
import '@/engine/styles/templates/excellence.css';
import '@/engine/styles/templates/elegante.css';

type Props = {params: Promise<{locale: string; slug: string}>};

export const dynamicParams = true;

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  
  const allowPreview = process.env.PREVIEW_DRAFTS === '1' || process.env.NODE_ENV !== 'production';
  if (!allowPreview) notFound();

  const template = getTemplateAny(slug);
  if (!template) notFound();
  
  const data = template.getData();
  const title = `Preview: ${resolveText(data.couple.firstName, locale)} & ${resolveText(data.couple.secondName, locale)}`;
  const description = resolveText(data.copy.welcome ?? '', locale);

  return {
    title,
    description,
    robots: {index: false, follow: false},
  };
}

export default async function PreviewPage({params}: Props) {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const allowPreview = process.env.PREVIEW_DRAFTS === '1' || process.env.NODE_ENV !== 'production';
  if (!allowPreview) notFound();

  const template = getTemplateAny(slug);
  if (!template) notFound();
  
  const data = template.getData();

  return (
    <div className={template.fontClassName}>
      <InvitationShell data={data} locale={locale} templateSlug={slug} />
    </div>
  );
}
