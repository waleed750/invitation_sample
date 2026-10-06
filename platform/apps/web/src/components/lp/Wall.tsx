'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {formatDate, type FormatLocale} from '@/lib/format';
import {InvitationScreen} from './InvitationScreen';
import {buildWallCards, filterDim, WALL_STYLES, type WallCard, type WallStyle} from './wall/cards';
import '@/styles/lp-wall.css';

// The marquee loops over half its track, so the repeating unit has to be wider than the
// widest viewport we support — otherwise a bare mint gap opens up mid-loop on large screens.
// Group 0 carries the real cards for screen readers; the rest are aria-hidden visual repeats.
const GROUP_COUNT = 6;

export function Wall({liveSlug}: {liveSlug: string}) {
  const t = useTranslations('lp.wall');
  const hero = useTranslations('lp.hero');
  const locale = useLocale() as FormatLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const [active, setActive] = useState<WallStyle | null>(null);
  const cards = buildWallCards();
  const dateText = formatDate(hero('dateDefault'), locale);

  function toggleStyle(style: WallStyle) {
    setActive((current) => (current === style ? null : style));
  }

  function renderCard(card: WallCard, duplicate: boolean) {
    const isLive = card.status === 'live';
    const className = `lp-wall__card${isLive ? ' lp-wall__card--live' : ''}${filterDim(card.styles, active) ? ' is-dim' : ''}`;
    const face = (
      <>
        <div className="lp-wall__arch" style={{blockSize: card.height}}>
          <InvitationScreen
            open
            variant={card.variant}
            names={hero('namesDefault')}
            line={hero('inviteLine')}
            dateText={dateText}
            dir={dir}
            lang={locale}
            className="lp-wall__invite"
          />
        </div>
        <div className="lp-wall__meta">
          <p className="lp-wall__name">{t(card.nameKey)}</p>
          {isLive ? (
            <>
              <p className="lp-wall__tag">{t('live.tag')}</p>
              <span className="lp-wall__try">{t('live.try')}</span>
            </>
          ) : (
            <span className="lp-wall__badge">{t('soon')}</span>
          )}
        </div>
      </>
    );
    if (isLive && !duplicate) return <Link className={className} href={`/templates/${liveSlug}`} key={card.key}>{face}</Link>;
    return <article className={className} key={card.key}>{face}</article>;
  }

  const groups = Array.from({length: GROUP_COUNT}, (_, index) => index);
  const renderGroup = (index: number) => (
    <div className="lp-wall__group" key={index} aria-hidden={index === 0 ? undefined : true}>
      {cards.map((card) => renderCard(card, index !== 0))}
    </div>
  );

  return (
    <section id="designs" className="lp-wall" aria-labelledby="lp-wall-title">
      <div className="lp-wrap">
        <h2 id="lp-wall-title" className="lp-h2">{t('title')}</h2>
        <p className="lp-lead lp-wall__sub">{t('sub')}</p>
        <div className="lp-wall__chips" role="group" aria-label={t('chipsLabel')}>
          {WALL_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className="lp-wall__filter"
              aria-pressed={active === style}
              onClick={() => toggleStyle(style)}
            >
              {t(`chips.${style}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="lp-wall__band">
        <div className="lp-wall__row lp-wall__row--a">
          <div className="lp-wall__track" dir={dir}>{groups.map(renderGroup)}</div>
        </div>
        <div className="lp-wall__row lp-wall__row--b">
          <div className="lp-wall__track" dir={dir}>{groups.map(renderGroup)}</div>
        </div>
      </div>

      <div className="lp-wrap lp-wall__foot">
        <Link className="lp-btn lp-btn--ink" href="/templates">{t('all')}</Link>
      </div>
    </section>
  );
}
