import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Bidi } from '@/components/Bidi';
import { formatMoney, type FormatLocale } from '@/lib/format';
import { TIERS, TIER_ORDER } from '@platform/shared';
import { comparisonRows } from './comparison';
import { listLiveTemplates } from '@/templates/registry';

// i18n keys use 'save'; TIER_ORDER uses 'save-the-date'.
const msgKey = (tier: (typeof TIER_ORDER)[number]) => (tier === 'save-the-date' ? 'save' : tier);

export function PricingCards() {
  const locale = useLocale();
  
  const tPricing = useTranslations('landing.pricing');
  const liveTemplates = listLiveTemplates();
  const featuredSlug = liveTemplates.find(t => t.entry.featured)?.entry.slug ?? liveTemplates[0]?.entry.slug ?? 'mashrabiya';

  const rows = comparisonRows();

  return (
    <section className="pricing-band" id="pricing" aria-labelledby="pricing-title">
      <div className="section container">
        <p className="eyebrow">{tPricing('eyebrow')}</p>
        <h2 id="pricing-title">{tPricing('title')}</h2>
        <p className="section-intro">{tPricing('description')}</p>
        
        <div className="grid">
          {TIER_ORDER.map((key) => {
            const isClassic = key === 'classic';
            return (
              <article className={`price-card ${isClassic ? 'featured' : ''}`} key={key}>
                <p className="eyebrow">{tPricing(`${msgKey(key)}.audience`)}</p>
                <h3>{tPricing(`${msgKey(key)}.name`)}</h3>
                <p className="price"><Bidi>{formatMoney(TIERS[key].price, locale as FormatLocale)}</Bidi></p>
                <p className="payment-note">{tPricing('once')}</p>
                <ul>
                  {(['one', 'two', 'three', 'four'] as const).map((feature) => (
                    <li key={feature}>{tPricing(`${msgKey(key)}.features.${feature}`)}</li>
                  ))}
                </ul>
                <Link href={`/checkout/${featuredSlug}?tier=${key}`} className={isClassic ? 'button' : 'button-outline'} style={{ display: 'flex', marginTop: '1rem', justifyContent: 'center' }}>
                  {tPricing('choose', { tier: tPricing(`${msgKey(key)}.name`) })}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="table-wrapper">
          <table className="comparison-table" aria-label={tPricing('title')}>
            <thead>
              <tr>
                <th></th>
                {TIER_ORDER.map(key => (
                  <th key={key}>{tPricing(`${msgKey(key)}.name`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key}>
                  <td className="feature-name">{tPricing(`compare.${row.key}`)}</td>
                  {TIER_ORDER.map(tier => {
                    const val = row.values[tier];
                    let display = row.render(val);
                    if (typeof display === 'boolean') {
                      display = display ? '✓' : '—';
                    } else if (display === 'unlimited') {
                      display = tPricing('compare.unlimited');
                    }
                    return <td key={tier}>{display}</td>;
                  })}
                </tr>
              ))}
              <tr>
                <td className="feature-name">{tPricing('addonsRow')}</td>
                <td colSpan={3} style={{ color: 'var(--muted)' }}>
                  {tPricing('addonsText')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
