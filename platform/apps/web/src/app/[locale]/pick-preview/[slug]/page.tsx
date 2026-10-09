import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {getTemplate} from '@/templates/registry';
import InvitationShell from '@/engine/InvitationShell';
import {personalizeData} from '@/pick/personalize';
import {parsePickParams, type SearchParams} from '@/pick/params';
import '@/engine/styles/templates/mashrabiya.css';
import '@/engine/styles/templates/africa.css';
import '@/engine/styles/templates/citystars.css';
import '@/engine/styles/templates/excellence.css';
import '@/engine/styles/templates/elegante.css';
import '@/engine/styles/templates/rawda.css';
import '@/engine/styles/templates/bustan.css';
import '@/engine/styles/templates/riwaq.css';

type Props = {
  params: Promise<{locale: string; slug: string}>;
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {robots: {index: false, follow: false}};

/**
 * Embeddable, personalised preview of a live template. It lives outside the
 * dashboard layout so template CSS never leaks into the app shell. Names and
 * date come from the query string and are injected into the template's sample
 * data by `personalizeData`; unknown or draft slugs 404.
 */
export default async function PickPreviewFrame({params, searchParams}: Props) {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const template = getTemplate(slug);
  if (!template) notFound();
  const details = parsePickParams(await searchParams);
  const data = personalizeData(template.getData(), details, locale);
  return (
    <div className={template.fontClassName}>
      <InvitationShell data={data} locale={locale} templateSlug={slug} />
    </div>
  );
}
