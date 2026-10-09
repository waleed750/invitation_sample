import '@/styles/pick.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {TIER_ORDER, TIERS, priceFor, resolveText, type Tier} from '@platform/shared';
import {Link} from '@/i18n/navigation';
import {formatMoney} from '@/lib/format';
import {PlanComparison} from '@/pick/PlanComparison';
import {
  checkoutHref,
  detailsQuery,
  gridHref,
  parsePickParams,
  previewFrameSrc,
  templateStepHref,
  type SearchParams
} from '@/pick/params';
import {isTier, planViews} from '@/pick/plans';
import {getTemplate} from '@/templates/registry';

type Props = {
  params: Promise<{locale: 'ar' | 'en'; slug: string}>;
  searchParams: Promise<SearchParams>;
};

export default async function PickPreviewPage({params, searchParams}: Props) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const template = getTemplate(slug);
  if (!template) notFound();

  const query = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const details = parsePickParams(query, today);
  const t = await getTranslations('pick');
  const name = resolveText(template.entry.name, locale);

  if (!details.complete) {
    return (
      <div className="pick-page">
        <p className="pick-eyebrow">{t('eyebrow')}</p>
        <p className="pick-lead">{t('preview.needDetails')}</p>
        <Link className="btn-primary" href={`/app/new?${detailsQuery(details)}`}>
          {t('preview.needDetailsAction')}
        </Link>
      </div>
    );
  }

  const requested = Array.isArray(query.tier) ? query.tier[0] : query.tier;
  const selected: Tier = isTier(requested) ? requested : template.entry.tier;
  const plans = planViews();
  const names = `${details.first} & ${details.second}`;
  const frameSrc = previewFrameSrc(locale, slug, details);

  const prices = Object.fromEntries(
    TIER_ORDER.map((tier) => [tier, formatMoney(priceFor(template.entry, tier), locale)])
  ) as Record<Tier, string>;
  const months = Object.fromEntries(
    TIER_ORDER.map((tier) => [tier, t('plans.months', {count: TIERS[tier].onlineMonths})])
  ) as Record<Tier, string>;
  const hrefs = Object.fromEntries(
    TIER_ORDER.map((tier) => [tier, `/${locale}${templateStepHref(slug, details, tier)}`])
  ) as Record<Tier, string>;
  const tierNames = Object.fromEntries(TIER_ORDER.map((tier) => [tier, t(`tiers.${tier}`)])) as Record<Tier, string>;

  return (
    <div className="pick-page pick-page--review">
      <p className="pick-eyebrow">{t('eyebrow')}</p>
      <h1 className="pick-section-title">{t('preview.title', {name})}</h1>

      <div className="pick-review">
        <div className="pick-stage">
          <div className="pick-frame">
            <iframe
              className="pick-frame__iframe"
              src={frameSrc}
              title={t('preview.frameTitle', {names})}
              loading="eager"
            />
          </div>
          <p className="pick-note">{t('preview.notice')}</p>
          <div className="pick-stage__links">
            <Link className="text-action-link" href={gridHref(details)}>{t('preview.changeDesign')}</Link>
            <Link className="text-action-link" href={`/app/new?${detailsQuery({first: details.first, second: details.second, date: ''})}`}>
              {t('preview.editDetails')}
            </Link>
            <a className="text-action-link" href={frameSrc} target="_blank" rel="noreferrer">
              {t('preview.openFull')}
            </a>
          </div>
        </div>

        <PlanComparison
          plans={plans}
          selected={selected}
          prices={prices}
          months={months}
          hrefs={hrefs}
          labels={{
            title: t('plans.title'),
            selected: t('plans.selected'),
            choose: t('plans.choose'),
            tierNames,
            edits: t('plans.edits'),
            online: t('plans.online'),
            rsvp: t('plans.rsvp'),
            rsvpNone: t('plans.rsvpNone'),
            rsvpUnlimited: t('plans.rsvpUnlimited'),
            videoIntro: t('plans.videoIntro'),
            musicUpload: t('plans.musicUpload'),
            guestMessages: t('plans.guestMessages'),
            prioritySupport: t('plans.prioritySupport'),
            yes: t('plans.yes'),
            no: t('plans.no')
          }}
        />
      </div>

      <div className="pick-bar">
        <div className="pick-bar__info">
          <span className="pick-bar__plan">{t('bar.plan', {tier: tierNames[selected]})}</span>
          <strong className="pick-bar__price" dir="ltr">{prices[selected]}</strong>
        </div>
        <Link className="btn-primary" href={checkoutHref(slug, selected, details)}>
          {t('bar.continue')}
        </Link>
      </div>
    </div>
  );
}
