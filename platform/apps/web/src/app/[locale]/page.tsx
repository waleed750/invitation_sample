import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {TIERS} from '@platform/shared';
import {routing} from '@/i18n/routing';
import {listLiveTemplates} from '@/templates/registry';
import {homeFontClassName} from '@/components/home/fonts';
import {SiteHeader} from '@/components/home/SiteHeader';
import {HeroLive} from '@/components/home/HeroLive';
import {Facts} from '@/components/home/Facts';
import {HowItWorks} from '@/components/home/HowItWorks';
import {Designs} from '@/components/home/Designs';
import {Pricing} from '@/components/home/Pricing';
import {Faq} from '@/components/home/Faq';
import {FinalBanner} from '@/components/home/FinalBanner';
import {SiteFooter} from '@/components/home/SiteFooter';
import {StickyCta} from '@/components/home/StickyCta';
import '@/styles/home.css';

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({locale, namespace: 'metadata'});
  return {title: t('title'), description: t('description')};
}

export default async function Landing({params}: Props) {
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
        <HeroLive featuredSlug={featuredSlug} />
        <Facts />
        <Designs />
        <HowItWorks editsAllowed={TIERS.classic.editsAllowed} />
        <Pricing featuredSlug={featuredSlug} />
        <Faq />
        <FinalBanner featuredSlug={featuredSlug} />
      </main>
      <SiteFooter />
      <StickyCta featuredSlug={featuredSlug} />
    </div>
  );
}
