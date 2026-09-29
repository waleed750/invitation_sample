import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {resolveText} from '@/lib/schemas/localized';
import {getVideoOpenData} from '@/data/demo/video-open';
import InvitationShell from '@/engine/InvitationShell';
import '@/engine/styles/video-open.css';

type Props = {params: Promise<{locale: string}>};
export const dynamicParams = false;
export function generateStaticParams() { return routing.locales.map(locale => ({locale})); }
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const data = getVideoOpenData();
  const title = `${resolveText(data.couple.firstName, locale)} & ${resolveText(data.couple.secondName, locale)} — ${resolveText(data.couple.headline ?? '', locale)}`;
  const description = resolveText(data.copy.welcome ?? '', locale);
  return {
    title, description, robots: {index: false, follow: false},
    alternates: {canonical: `/${locale}/demo/video-open`, languages: {ar: '/ar/demo/video-open', en: '/en/demo/video-open'}},
    openGraph: {title, description, locale: locale === 'ar' ? 'ar_EG' : 'en_GB', type: 'website'}
  };
}
export default async function VideoOpenDemo({params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <InvitationShell data={getVideoOpenData()} locale={locale} />;
}
