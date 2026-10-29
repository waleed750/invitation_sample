import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {PreviewFrameHost} from '@/editor/PreviewFrameHost';
import {routing} from '@/i18n/routing';
import {getTemplateAny} from '@/templates/registry';
import '@/templates/template-styles';
import '@/styles/public.css';

type Props = {params: Promise<{locale: string; template: string}>};

export const metadata: Metadata = {robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

/** The page inside the editor's preview iframe (see editor/Preview.tsx). */
export default async function EditorFramePage({params}: Props) {
  const {locale, template: slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const template = getTemplateAny(slug);
  if (!template) notFound();
  const messages = await getMessages();
  return (
    <div className={template.fontClassName}>
      <PreviewFrameHost templateSlug={slug} locale={locale as 'ar' | 'en'} messages={messages} />
    </div>
  );
}
