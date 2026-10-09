import '@/styles/pick.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {TIER_ORDER, priceFor, resolveText, type Tier} from '@platform/shared';
import {Link} from '@/i18n/navigation';
import {formatDate, formatMoney} from '@/lib/format';
import {DetailsForm} from '@/pick/DetailsForm';
import {PickTemplateCard} from '@/pick/PickTemplateCard';
import {detailsQuery, parsePickParams, templateStepHref, type SearchParams} from '@/pick/params';
import {isTier} from '@/pick/plans';
import {listLiveTemplates} from '@/templates/registry';

type Props = {
  params: Promise<{locale: 'ar' | 'en'}>;
  searchParams: Promise<SearchParams>;
};

export default async function NewInvitationPage({params, searchParams}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const details = parsePickParams(query, today);
  // The GET form always sends `date` (even when empty); the "edit details" link omits it.
  const submitted = query.date !== undefined;
  const t = await getTranslations('pick');

  const planParam = Array.isArray(query.plan) ? query.plan[0] : query.plan;
  const planFilter: Tier | undefined = isTier(planParam) ? planParam : undefined;

  const steps = (
    <ol className="pick-steps" aria-label={t('steps.label')}>
      <li className={details.complete ? 'is-done' : 'is-current'}>{t('steps.details')}</li>
      <li className={details.complete ? 'is-current' : ''}>{t('steps.template')}</li>
      <li>{t('steps.review')}</li>
    </ol>
  );

  if (!details.complete) {
    return (
      <div className="pick-page">
        <p className="pick-eyebrow">{t('eyebrow')}</p>
        {steps}
        <DetailsForm
          action={`/${locale}/app/new`}
          values={details}
          errors={details.errors}
          showErrors={submitted}
          min={today}
          labels={{
            title: t('details.title'),
            lead: t('details.lead'),
            first: t('details.first'),
            firstPlaceholder: t('details.firstPlaceholder'),
            second: t('details.second'),
            secondPlaceholder: t('details.secondPlaceholder'),
            date: t('details.date'),
            submit: t('details.submit'),
            errors: {
              missing: t('details.errors.missing'),
              invalid: t('details.errors.invalid'),
              past: t('details.errors.past')
            }
          }}
        />
      </div>
    );
  }

  // Template list: local registry (live templates). The API commerce client has no template listing yet.
  const templates = listLiveTemplates().filter((item) => !planFilter || item.entry.tier === planFilter);
  const names = `${details.first} & ${details.second}`;
  const filterHref = (tier?: Tier) =>
    `/app/new?${detailsQuery(details, tier ? {plan: tier} : {})}`;

  return (
    <div className="pick-page">
      <p className="pick-eyebrow">{t('eyebrow')}</p>
      {steps}
      <section aria-labelledby="pick-grid-title">
        <h1 id="pick-grid-title" className="pick-section-title">{t('grid.title')}</h1>
        <p className="pick-lead">{t('grid.lead')}</p>
        <div className="pick-summary">
          <span>{t('grid.summary', {names, date: formatDate(`${details.date}T12:00:00Z`, locale)})}</span>
          <Link className="text-action-link" href={`/app/new?${detailsQuery({first: details.first, second: details.second, date: ''})}`}>
            {t('grid.edit')}
          </Link>
        </div>
        <nav className="pick-filter" aria-label={t('grid.filterLabel')}>
          <Link className={`pick-chip${planFilter ? '' : ' is-active'}`} href={filterHref()}>{t('grid.filterAll')}</Link>
          {TIER_ORDER.map((tier) => (
            <Link key={tier} className={`pick-chip${planFilter === tier ? ' is-active' : ''}`} href={filterHref(tier)}>
              {t(`tiers.${tier}`)}
            </Link>
          ))}
        </nav>
        {templates.length === 0 ? (
          <p className="pick-lead">{t('grid.empty')}</p>
        ) : (
          <div className="pick-grid">
            {templates.map((item) => {
              const data = item.getData();
              return (
                <PickTemplateCard
                  key={item.entry.slug}
                  href={`/${locale}${templateStepHref(item.entry.slug, details, planFilter)}`}
                  name={resolveText(item.entry.name, locale)}
                  tagline={resolveText(item.entry.tagline, locale)}
                  tierLabel={t(`tiers.${item.entry.tier}`)}
                  priceText={t('grid.from', {price: formatMoney(priceFor(item.entry), locale)})}
                  cta={t('grid.cta')}
                  featuredLabel={item.entry.featured ? t('grid.featured') : undefined}
                  names={names}
                  background={data.theme.background}
                  foreground={data.theme.foreground}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
