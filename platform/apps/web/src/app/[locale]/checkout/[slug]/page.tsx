import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isPubliclyListed, TIER_ORDER, type Tier} from '@platform/shared';
import {DemoBanner} from '@/commerce/DemoBanner';
import {CheckoutForm} from '@/commerce/CheckoutForm';
import {quote} from '@/commerce/pricing';
import {routing} from '@/i18n/routing';
import {getTemplate} from '@/templates/registry';
import type {OrderKind} from '@/commerce/types';

type Props = {
  params: Promise<{locale: string; slug: string}>;
  searchParams: Promise<{
    tier?: string | string[];
    kind?: string | string[];
    names?: string | string[];
    date?: string | string[];
  }>;
};

function parseNames(raw?: string): {first: string; second: string} {
  if (!raw || !raw.trim()) return {first: '', second: ''};
  const trimmed = raw.trim();
  // Split on '&', ' و ', ' and ', or ','
  const parts = trimmed.split(/\s*(?:&|and|,\s*|\s+و\s+)\s*/i);
  if (parts.length >= 2) {
    return {first: parts[0].trim(), second: parts.slice(1).join(' ').trim()};
  }
  const words = trimmed.split(/\s+/);
  if (words.length === 2) {
    return {first: words[0], second: words[1]};
  }
  return {first: trimmed, second: ''};
}

export default async function CheckoutPage({params, searchParams}: Props) {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const template = getTemplate(slug);
  if (!template || !isPubliclyListed(template.entry)) notFound();

  const query = await searchParams;
  const requestedTier = Array.isArray(query.tier) ? query.tier[0] : query.tier;
  const initialTier: Tier = TIER_ORDER.includes(requestedTier as Tier)
    ? (requestedTier as Tier)
    : template.entry.tier;

  const requestedKind = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const kind: OrderKind =
    requestedKind === 'edits' || requestedKind === 'extension' ? requestedKind : 'new';

  const rawNames = Array.isArray(query.names) ? query.names[0] : query.names;
  const rawDate = Array.isArray(query.date) ? query.date[0] : query.date;

  const {first: initialFirst, second: initialSecond} = parseNames(rawNames);
  const initialDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';

  const quotes = Object.fromEntries(
    TIER_ORDER.map((tier) => [
      tier,
      {
        standard: quote({templateSlug: slug, tier, kind, balance: 0}),
        welcome: quote({templateSlug: slug, tier, kind, couponCode: 'WELCOME10', balance: 0}),
      },
    ]),
  ) as Record<Tier, {standard: ReturnType<typeof quote>; welcome: ReturnType<typeof quote>}>;

  const templateName =
    (typeof template.entry.name === 'string'
      ? template.entry.name
      : template.entry.name[locale as 'ar' | 'en'] ?? template.entry.name.ar) ?? slug;

  const t = await getTranslations('checkout');

  return (
    <>
      <DemoBanner />
      <main className="commerce-main">
        <div className="checkout-heading">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
        <CheckoutForm
          locale={locale as 'ar' | 'en'}
          templateSlug={slug}
          templateName={templateName}
          initialTier={initialTier}
          kind={kind}
          quotes={quotes}
          initialFirst={initialFirst}
          initialSecond={initialSecond}
          initialDate={initialDate}
        />
      </main>
    </>
  );
}
