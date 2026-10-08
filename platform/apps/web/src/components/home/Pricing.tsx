import {getLocale, getTranslations} from 'next-intl/server';
import {TIERS, TIER_ORDER, type Tier} from '@platform/shared';
import {formatMoney, type FormatLocale} from '@/lib/format';
import {Chevron} from './Chevron';
import {StarMark} from './StarMark';
import {PricingClient, type ComparisonRowData} from './PricingClient';

// Every figure comes from TIERS, never from message text.
export async function Pricing({
  featuredSlug,
  compareOpen = false,
  headingLevel = 2,
  showTrustRow = false,
}: {
  featuredSlug: string;
  compareOpen?: boolean;
  headingLevel?: 1 | 2;
  showTrustRow?: boolean;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const t = await getTranslations('home.pricing');
  const locale = (await getLocale()) as FormatLocale;

  const featuresFor = (tier: Tier): string[] => {
    const plan = TIERS[tier];
    const list = [t('f.months', {n: plan.onlineMonths}), t('f.edits', {n: plan.editsAllowed})];
    list.push(plan.rsvpLimit === 0 ? t('f.rsvpNone') : plan.rsvpLimit === null ? t('f.rsvpUnlimited') : t('f.rsvpLimit', {n: plan.rsvpLimit}));
    if (plan.videoIntro || plan.musicUpload) list.push(t('f.videoMusic'));
    if (plan.guestMessages) list.push(t('f.messages'));
    if (plan.prioritySupport) list.push(t('f.support'));
    return list;
  };

  const yes = t('compare.yes');
  const no = t('compare.no');
  const flag = (value: boolean) => (value ? yes : no);

  const rows: {label: string; cell: (tier: Tier) => string | number}[] = [
    {label: t('compare.months'), cell: (tier) => t('f.months', {n: TIERS[tier].onlineMonths})},
    {label: t('compare.edits'), cell: (tier) => TIERS[tier].editsAllowed},
    {label: t('compare.rsvp'), cell: (tier) => TIERS[tier].rsvpLimit === 0 ? no : TIERS[tier].rsvpLimit === null ? t('compare.unlimited') : TIERS[tier].rsvpLimit},
    {label: t('compare.video'), cell: (tier) => flag(TIERS[tier].videoIntro)},
    {label: t('compare.music'), cell: (tier) => flag(TIERS[tier].musicUpload)},
    {label: t('compare.messages'), cell: (tier) => flag(TIERS[tier].guestMessages)},
    {label: t('compare.support'), cell: (tier) => flag(TIERS[tier].prioritySupport)},
  ];

  const planNames = Object.fromEntries(TIER_ORDER.map((tier) => [tier, t(`plans.${tier}.name`)])) as Record<Tier, string>;
  const planDescs = Object.fromEntries(TIER_ORDER.map((tier) => [tier, t(`plans.${tier}.desc`)])) as Record<Tier, string>;
  const planFeatures = Object.fromEntries(TIER_ORDER.map((tier) => [tier, featuresFor(tier)])) as Record<Tier, string[]>;
  const pricesFormatted = Object.fromEntries(TIER_ORDER.map((tier) => [tier, formatMoney(TIERS[tier].price, locale)])) as Record<Tier, string>;
  const chooseText = Object.fromEntries(TIER_ORDER.map((tier) => [tier, t('choose', {plan: t(`plans.${tier}.name`)})])) as Record<Tier, string>;

  const compareRowsData: ComparisonRowData[] = rows.map((r) => ({
    label: r.label,
    values: {
      'save-the-date': r.cell('save-the-date'),
      classic: r.cell('classic'),
      premium: r.cell('premium'),
    },
  }));

  const shouldShowTrust = showTrustRow || compareOpen;

  return (
    <section className="hm-section hm-section--alt hm-pricing" id="pricing" aria-labelledby="hm-pricing-title">
      <div className="hm-wrap">
        <div className="hm-head">
          <p className="hm-eyebrow">{t('eyebrow')}</p>
          <Heading id="hm-pricing-title" className="hm-h2">{t('title')}</Heading>
          <p className="hm-sub">{t('sub')}</p>
        </div>

        <PricingClient
          featuredSlug={featuredSlug}
          planNames={planNames}
          planDescs={planDescs}
          planFeatures={planFeatures}
          pricesFormatted={pricesFormatted}
          perText={t('per')}
          badgeText={t('badge')}
          chooseText={chooseText}
          compareRows={compareRowsData}
          switcherAriaLabel={t('title')}
          compareMobileTitle={t('compareMobileTitle')}
        />

        {shouldShowTrust ? (
          <div className="hm-trust-row" role="region" aria-label={t('trust.title')}>
            <div className="hm-trust-item">
              <svg className="hm-trust-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>{t('trust.secure')}</span>
            </div>
            <div className="hm-trust-item">
              <StarMark size={16} ring={false} />
              <span>{t('trust.once')}</span>
            </div>
            <div className="hm-trust-item">
              <svg className="hm-trust-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>{t('trust.refund')}</span>
            </div>
          </div>
        ) : null}

        <div className="hm-pricing__foot">
          <details className={`hm-compare ${compareOpen ? 'is-always-open' : ''}`} open={compareOpen}>
            <summary><Chevron className="hm-chev" />{t('compare.toggle')}</summary>
            <div className="hm-compare__wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t('compare.feature')}</th>
                    {TIER_ORDER.map((tier) => (
                      <th scope="col" key={tier} className={tier === 'classic' ? 'is-featured' : ''}>
                        {t(`plans.${tier}.name`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {TIER_ORDER.map((tier) => (
                        <td key={tier} className={tier === 'classic' ? 'is-featured' : ''}>
                          {row.cell(tier)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="hm-pricing__refund">{t('refund')}</p>
        </div>
      </div>
    </section>
  );
}
