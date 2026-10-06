import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import InvitationShell from '@/engine/InvitationShell';
import {getPublicStore} from '@/guest';
import {applyPersonalization} from '@/guest/personalize';
import {PublicInvitationProvider} from '@/guest/PublicInvitationProvider';
import {routing} from '@/i18n/routing';
import {formatDate} from '@/lib/format';
import {getTemplate} from '@/templates/registry';
import '@/engine/styles/templates/mashrabiya.css';
import '@/styles/public.css';

type Props = {params: Promise<{locale: string; slug: string}>};

export const dynamic = 'force-dynamic';

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const snapshot = await getPublicStore().getBySlug(slug);
  if (!snapshot) notFound();
  const t = await getTranslations({locale, namespace: 'public'});
  const title = `${snapshot.couple.first} & ${snapshot.couple.second}`;
  const description = t('metadata.description', {date: formatDate(snapshot.eventDate, locale)});
  return {
    title,
    description,
    robots: {index: false, follow: false},
    openGraph: {title, description, locale: locale === 'ar' ? 'ar_EG' : 'en_GB', type: 'website'},
  };
}

export default async function PublicInvitationPage({params}: Props) {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const snapshot = await getPublicStore().getBySlug(slug);
  if (!snapshot) notFound();
  const t = await getTranslations('public');
  if (Date.now() > new Date(snapshot.onlineUntil).getTime()) {
    return <main className="public-status-page"><div><p className="eyebrow">{t('expired.eyebrow')}</p><h1>{t('expired.title')}</h1><p>{t('expired.description')}</p></div></main>;
  }
  const template = getTemplate(snapshot.templateSlug);
  if (!template) notFound();
  const data = applyPersonalization(template.getData(), snapshot, locale);
  return <div className={template.fontClassName}><PublicInvitationProvider slug={slug}><InvitationShell data={data} locale={locale} templateSlug={snapshot.templateSlug} /></PublicInvitationProvider></div>;
}
