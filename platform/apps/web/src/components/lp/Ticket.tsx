import {getLocale, getTranslations} from 'next-intl/server';
import {TIERS, TIER_ORDER} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {Link} from '@/i18n/navigation';
import {formatMoney, type FormatLocale} from '@/lib/format';

// One perforated ticket, three plan columns. Every number comes from TIERS, never from copy.
export async function Ticket({featuredSlug}: {featuredSlug: string}) {
  const t = await getTranslations('lp.price');
  const locale = (await getLocale()) as FormatLocale;
  return (
    <section className="lp-price" id="pricing" aria-labelledby="lp-price-title">
      <div className="lp-wrap">
        <h2 id="lp-price-title" className="lp-h2">{t('title')}</h2>
        <p className="lp-lead">{t('sub')}</p>
        <div className="lp-ticket" role="list" aria-label={t('ticket')}>
          {TIER_ORDER.map((tier) => {
            const plan = TIERS[tier];
            const popular = tier === 'classic';
            const rsvp = plan.rsvpLimit === 0 ? t('rsvp.none') : plan.rsvpLimit === null ? t('rsvp.unlimited') : t('rsvp.limit', {n: plan.rsvpLimit});
            return (
              <article className={`lp-ticket__col ${popular ? 'is-popular' : ''}`} key={tier} role="listitem">
                {popular ? <span className="lp-stamp">{t('stamp')}</span> : null}
                <h3 className="lp-ticket__name">{t(`plans.${tier}`)}</h3>
                <p className="lp-ticket__price"><Bidi>{formatMoney(plan.price, locale)}</Bidi></p>
                <ul className="lp-ticket__facts">
                  <li>{t('months', {n: plan.onlineMonths})}</li>
                  <li>{rsvp}</li>
                  <li>{plan.videoIntro ? t('video.yes') : t('video.no')}</li>
                </ul>
                <Link className={`lp-btn ${popular ? 'lp-btn--red' : 'lp-btn--ink'}`} href={`/checkout/${featuredSlug}?tier=${tier}`}>{t('choose', {plan: t(`plans.${tier}`)})}</Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
