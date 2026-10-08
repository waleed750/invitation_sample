import {getLocale, getTranslations} from 'next-intl/server';
import {priceFor, resolveText, type CatalogEntry, type Locale} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {Link} from '@/i18n/navigation';
import {formatDate, formatMoney, type FormatLocale} from '@/lib/format';
import {listLiveTemplates} from '@/templates/registry';
import {Chevron} from './Chevron';
import {InvitationScreen} from './InvitationScreen';
import '../../styles/home-designs.css';

type CardCopy = {name: string; desc: string; style: string | null};

// templates.live.* describes one single live design; once more are live, the catalog carries the copy.
function cardCopy(entry: CatalogEntry, liveCount: number, locale: Locale, live: (key: 'name' | 'desc' | 'style') => string): CardCopy {
  if (liveCount === 1) return {name: live('name'), desc: live('desc'), style: live('style')};
  const described = resolveText(entry.name, locale) === live('name');
  return {
    name: resolveText(entry.name, locale),
    desc: described ? live('desc') : resolveText(entry.tagline, locale),
    style: described ? live('style') : null,
  };
}

export async function Designs({standalone = false}: {standalone?: boolean} = {}) {
  const t = await getTranslations('home');
  const locale = (await getLocale()) as FormatLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const liveTemplates = listLiveTemplates();
  const dateText = formatDate(`${t('hero.phone.defaultDate')}T12:00:00`, locale);
  return (
    <section id="designs" className={`hm-section hm-section--alt${standalone ? ' hm-section--tight' : ''}`} aria-labelledby="hm-designs-title">
      <div className="hm-wrap">
        <div className="hm-designs__head">
          <div className="hm-designs__titles">
            <p className="hm-eyebrow">{t('templates.eyebrow')}</p>
            {standalone ? <h1 id="hm-designs-title" className="hm-h2">{t('templates.title')}</h1> : <h2 id="hm-designs-title" className="hm-h2">{t('templates.title')}</h2>}
          </div>
          {standalone ? null : <Link className="hm-btn hm-btn--ghost" href="/templates">{t('templates.all')}<Chevron /></Link>}
        </div>
        <div className="hm-designs__grid">
          {liveTemplates.map((template, index) => {
            const {entry} = template;
            const copy = cardCopy(entry, liveTemplates.length, locale, (key) => t(`templates.live.${key}`));
            return (
              <article className="hm-designs__card" key={entry.slug}>
                <div className="hm-designs__art">
                  <InvitationScreen variant={(['ink', 'ivory', 'green'] as const)[index % 3]} open names={t('hero.phone.defaultNames')} dateText={dateText}
                    line={t('hero.phone.line')} dir={dir} lang={locale} />
                  <span className="hm-designs__badge">{t('templates.ready')}</span>
                  {copy.style ? <span className="hm-designs__style">{copy.style}</span> : null}
                </div>
                <div className="hm-designs__meta">
                  <div className="hm-designs__namerow">
                    <h3 className="hm-designs__name">{copy.name}</h3>
                    <p className="hm-designs__price">{t('templates.from')} <Bidi>{formatMoney(priceFor(entry), locale)}</Bidi></p>
                  </div>
                  <p className="hm-designs__desc">{copy.desc}</p>
                  <div className="hm-designs__actions">
                    <Link className="hm-btn hm-btn--line" href={`/templates/${entry.slug}`}>{t('templates.preview')}</Link>
                    <Link className="hm-btn hm-btn--primary" href={`/checkout/${entry.slug}?tier=${entry.tier}`}>{t('templates.use')}</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
