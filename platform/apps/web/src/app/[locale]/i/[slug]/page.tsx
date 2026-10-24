import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import InvitationShell from '@/engine/InvitationShell';
import {EndedInvitation} from '@/components/EndedInvitation';
import {getEndedInvitation, getPublicStore} from '@/guest';
import {applyPersonalization} from '@/guest/personalize';
import {PublicInvitationProvider} from '@/guest/PublicInvitationProvider';
import {routing} from '@/i18n/routing';
import {formatDate} from '@/lib/format';
import {getTemplate} from '@/templates/registry';
import '@/engine/styles/templates/mashrabiya.css';
import '@/engine/styles/templates/diwan.css';
import '@/styles/public.css';

type Props = {params: Promise<{locale: string; slug: string}>};

export const dynamic = 'force-dynamic';

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const snapshot = await getPublicStore().getBySlug(slug);
  if (!snapshot) {
    // An ended invitation keeps its own page (and never gets indexed); only a truly unknown slug is a 404.
    if (!(await getEndedInvitation(slug))) notFound();
    const ended = await getTranslations({locale, namespace: 'public.ended'});
    return {title: ended('eyebrow'), robots: {index: false, follow: false}};
  }
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
  if (!snapshot) {
    // An invitation whose online period is over gets its own page instead of a 404.
    const ended = await getEndedInvitation(slug);
    if (!ended) notFound();
    return <EndedInvitation first={ended.first} second={ended.second} eventDate={ended.eventDate} locale={locale as 'ar' | 'en'} />;
  }
  if (Date.now() > new Date(snapshot.onlineUntil).getTime()) {
    return <EndedInvitation first={snapshot.couple.first} second={snapshot.couple.second} eventDate={snapshot.eventDate} locale={locale as 'ar' | 'en'} />;
  }
  const template = getTemplate(snapshot.templateSlug);
  if (!template) notFound();
  const data = applyPersonalization(template.getData(), snapshot, locale);
  return <div className={template.fontClassName}><PublicInvitationProvider slug={slug}><InvitationShell data={data} locale={locale} templateSlug={snapshot.templateSlug} /></PublicInvitationProvider></div>;
}
