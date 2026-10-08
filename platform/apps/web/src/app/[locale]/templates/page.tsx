import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {listLiveTemplates} from '@/templates/registry';
import {homeFontClassName} from '@/components/home/fonts';
import {SiteHeader} from '@/components/home/SiteHeader';
import {SiteFooter} from '@/components/home/SiteFooter';
import {Designs} from '@/components/home/Designs';
import '@/styles/home.css';

type Props = {params: Promise<{locale: string}>};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({locale, namespace: 'templates'});
  const tMeta = await getTranslations({locale, namespace: 'metadata'});
  return {
    title: `${t('title')} | ${tMeta('title')}`,
    description: t('description'),
    alternates: {
      canonical: `/${locale}/templates`,
      languages: {ar: '/ar/templates', en: '/en/templates', 'x-default': '/ar/templates'}
    }
  };
}

export default async function TemplatesPage({params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const live = listLiveTemplates();
  const featuredSlug = live.find((item) => item.entry.featured)?.entry.slug ?? live[0]?.entry.slug ?? 'mashrabiya';
  return (
    <div className={`hm ${homeFontClassName}`} data-locale={locale}>
      <a className="hm-skip" href="#main">{t('skip')}</a>
      <SiteHeader featuredSlug={featuredSlug} current="/templates" />
      <main id="main"><Designs standalone /></main>
      <SiteFooter />
    </div>
  );
}
