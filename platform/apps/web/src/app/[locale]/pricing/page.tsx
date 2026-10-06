import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {listLiveTemplates} from '@/templates/registry';
import {homeFontClassName} from '@/components/home/fonts';
import {SiteHeader} from '@/components/home/SiteHeader';
import {Pricing} from '@/components/home/Pricing';
import {Faq} from '@/components/home/Faq';
import {FinalBanner} from '@/components/home/FinalBanner';
import {SiteFooter} from '@/components/home/SiteFooter';
import {StickyCta} from '@/components/home/StickyCta';
import '@/styles/home.css';

type Props = {params: Promise<{locale: string}>};
export const dynamicParams = false;
export function generateStaticParams() { return routing.locales.map((locale) => ({locale})); }

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({locale, namespace: 'home.pricing'});
  return {
    title: t('title'), description: t('sub'),
    alternates: {canonical: `/${locale}/pricing`, languages: {ar: '/ar/pricing', en: '/en/pricing'}}
  };
}

export default async function PricingPage({params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const live = listLiveTemplates();
  const featuredSlug = live.find((item) => item.entry.featured)?.entry.slug ?? live[0]?.entry.slug ?? 'mashrabiya';
  return (
    <div className={`hm ${homeFontClassName}`} data-locale={locale}>
      <a className="hm-skip" href="#main">{t('skip')}</a>
      <SiteHeader featuredSlug={featuredSlug} />
      <main id="main">
        <Pricing featuredSlug={featuredSlug} compareOpen headingLevel={1} />
        <Faq />
        <FinalBanner />
      </main>
      <SiteFooter />
      <StickyCta featuredSlug={featuredSlug} />
    </div>
  );
}
