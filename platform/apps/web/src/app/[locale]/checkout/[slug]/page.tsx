import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isPubliclyListed, TIER_ORDER, type Tier} from '@platform/shared';
import {DemoBanner} from '@/commerce/DemoBanner';
import {CheckoutForm} from '@/commerce/CheckoutForm';
import {quote} from '@/commerce/pricing';
import {routing} from '@/i18n/routing';
import {getTemplate} from '@/templates/registry';

type Props = {params: Promise<{locale: string; slug: string}>; searchParams: Promise<{tier?: string | string[]}>};

export default async function CheckoutPage({params, searchParams}: Props) {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const template = getTemplate(slug);
  if (!template || !isPubliclyListed(template.entry)) notFound();
  const requestedTier = (await searchParams).tier;
  const tierValue = Array.isArray(requestedTier) ? requestedTier[0] : requestedTier;
  const initialTier: Tier = TIER_ORDER.includes(tierValue as Tier) ? tierValue as Tier : template.entry.tier;
  const quotes = Object.fromEntries(TIER_ORDER.map((tier) => [tier, {
    standard: quote({templateSlug: slug, tier, kind: 'new', balance: 0}),
    welcome: quote({templateSlug: slug, tier, kind: 'new', couponCode: 'WELCOME10', balance: 0}),
  }])) as Record<Tier, {standard: ReturnType<typeof quote>; welcome: ReturnType<typeof quote>}>;
  const t = await getTranslations('checkout');

  return <>
    <DemoBanner />
    <header className="commerce-header container"><a className="brand" href={`/${locale}`}>{t('brand')}</a><span>{t('secure')}</span></header>
    <main className="commerce-main container">
      <div className="checkout-heading"><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p>{t('description')}</p></div>
      <CheckoutForm locale={locale} templateSlug={slug} initialTier={initialTier} quotes={quotes} />
    </main>
  </>;
}

