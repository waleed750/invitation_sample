import {getLocale, getTranslations} from 'next-intl/server';
import {TIERS, TIER_ORDER, type Tier} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {Link} from '@/i18n/navigation';
import {formatMoney, type FormatLocale} from '@/lib/format';
import {Chevron} from './Chevron';
import {StarMark} from './StarMark';

// Every figure comes from TIERS, never from message text.
export async function Pricing({featuredSlug, compareOpen = false, headingLevel = 2}: {featuredSlug: string; compareOpen?: boolean; headingLevel?: 1 | 2}) {
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
    {label: t('compare.support'), cell: (tier) => flag(TIERS[tier].prioritySupport)}
  ];
  return (
    <section className="hm-section hm-section--alt hm-pricing" id="pricing" aria-labelledby="hm-pricing-title">
      <div className="hm-wrap">
        <div className="hm-head">
          <p className="hm-eyebrow">{t('eyebrow')}</p>
          <Heading id="hm-pricing-title" className="hm-h2">{t('title')}</Heading>
          <p className="hm-sub">{t('sub')}</p>
        </div>
        <div className="hm-pricing__grid">
          {TIER_ORDER.map((tier) => {
            const featured = tier === 'classic';
            return (
              <article className={`hm-plan ${featured ? 'is-featured' : ''}`} key={tier}>
                {featured ? <span className="hm-plan__seal"><StarMark size={16} ring={false} />{t('badge')}</span> : null}
                <div>
                  <h3 className="hm-plan__name">{t(`plans.${tier}.name`)}</h3>
                  <p className="hm-plan__desc">{t(`plans.${tier}.desc`)}</p>
                  <p className="hm-plan__price"><span className="hm-plan__amount"><Bidi>{formatMoney(TIERS[tier].price, locale)}</Bidi></span><span className="hm-plan__per">{t('per')}</span></p>
                  <ul>{featuresFor(tier).map((line) => <li key={line}><StarMark size={16} ring={false} /><span>{line}</span></li>)}</ul>
                </div>
                <Link className={`hm-btn ${featured ? 'hm-btn--primary' : 'hm-btn--line'}`} href={`/checkout/${featuredSlug}?tier=${tier}`}>{t('choose', {plan: t(`plans.${tier}.name`)})}<Chevron /></Link>
              </article>
            );
          })}
        </div>
        <div className="hm-pricing__foot">
          <details className="hm-compare" open={compareOpen}>
            <summary><Chevron className="hm-chev" />{t('compare.toggle')}</summary>
            <div className="hm-compare__wrap">
              <table>
                <thead><tr><th scope="col">{t('compare.feature')}</th>{TIER_ORDER.map((tier) => <th scope="col" key={tier}>{t(`plans.${tier}.name`)}</th>)}</tr></thead>
                <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{TIER_ORDER.map((tier) => <td key={tier}>{row.cell(tier)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </details>
          <p className="hm-pricing__refund">{t('refund')}</p>
        </div>
      </div>
    </section>
  );
}
