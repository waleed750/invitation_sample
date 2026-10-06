import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Link} from '@/i18n/navigation';
import {TIERS} from '@platform/shared';
import {listLiveTemplates} from '@/templates/registry';
import {lpFontClassName} from '@/components/lp/fonts';
import {LpHeader} from '@/components/lp/LpHeader';
import {Hero} from '@/components/lp/Hero';
import {Journey} from '@/components/lp/Journey';
import {Wall} from '@/components/lp/Wall';
import {FlipToy} from '@/components/lp/FlipToy';
import {Ticket} from '@/components/lp/Ticket';
import {FinalBand} from '@/components/lp/FinalBand';
import {LpFooter} from '@/components/lp/LpFooter';
import '@/styles/lp.css';

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
  const t = await getTranslations('lp');
  const live = listLiveTemplates();
  const featuredSlug = live.find((item) => item.entry.featured)?.entry.slug ?? live[0]?.entry.slug ?? 'mashrabiya';
  return (
    <div className={`lp ${lpFontClassName}`} data-locale={locale}>
      <a className="lp-skip" href="#main">{t('skip')}</a>
      <LpHeader featuredSlug={featuredSlug} />
      <main id="main">
        <Hero />
        <Journey />
        <Wall liveSlug={featuredSlug} />
        <FlipToy editsAllowed={TIERS.classic.editsAllowed} />
        <Ticket featuredSlug={featuredSlug} />
        <FinalBand featuredSlug={featuredSlug} />
      </main>
      <LpFooter />
      <div className="lp-sticky"><Link className="lp-btn lp-btn--red lp-btn--big" href={`/checkout/${featuredSlug}`}>{t('nav.start')}</Link></div>
    </div>
  );
}
