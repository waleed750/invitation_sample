'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {formatDate, type FormatLocale} from '@/lib/format';
import {Chevron} from './Chevron';
import {RiwaqPhone} from './RiwaqPhone';
import {Phone} from './Phone';
import {StarMark} from './StarMark';

const MAX_NAMES = 40;

export function HeroLive({featuredSlug}: {featuredSlug: string}) {
  const t = useTranslations('home.hero');
  const locale = useLocale() as FormatLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const [names, setNames] = useState('');
  const [date, setDate] = useState(t('phone.defaultDate'));
  const [showDate, setShowDate] = useState(false);
  const [open, setOpen] = useState(false);
  const hasAutoplayed = useRef(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const node = phoneRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setOpen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasAutoplayed.current) {
          hasAutoplayed.current = true;
          setOpen(true);
        }
      },
      {threshold: 0.25}
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const shownNames = names.trim() || t('phone.defaultNames');
  const fallback = new Date(`${t('phone.defaultDate')}T12:00:00`);
  const parsed = date ? new Date(`${date}T12:00:00`) : fallback;
  const dateText = formatDate(Number.isNaN(parsed.getTime()) ? fallback : parsed, locale);

  function replayInvitation() {
    window.clearTimeout(timer.current);
    setOpen(false);
    timer.current = window.setTimeout(() => setOpen(true), 120);
  }

  const checkoutParams = new URLSearchParams();
  if (names.trim()) checkoutParams.set('names', names.trim());
  if (date) checkoutParams.set('date', date);
  const checkoutUrl = `/checkout/${featuredSlug}?${checkoutParams.toString()}`;

  return (
    <section id="hero" className="hm-hero" aria-labelledby="hm-hero-title">
      {/* Decorative riwaq scene assets */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hm-hero__garland" src="/assets/demo/riwaq/garland.jpg" alt="" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hm-hero__col hm-hero__col--start" src="/assets/demo/riwaq/column.png" alt="" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hm-hero__col hm-hero__col--end" src="/assets/demo/riwaq/column.png" alt="" aria-hidden="true" />

      <div className="hm-wrap hm-hero__grid">
        <div className="hm-hero__head">
          <p className="hm-hero__tag">
            <StarMark size={16} ring={false} />
            {t('tag')}
          </p>
          <h1 id="hm-hero-title" className="hm-hero__title">
            <span>{t('title1')}</span>
            <span className="hm-hero__accent">{t('title2')}</span>
          </h1>
          <p className="hm-hero__sub">{t('sub')}</p>
        </div>

        <div className="hm-hero__stage" ref={phoneRef}>
          <div className="hm-hero__phone-glow" aria-hidden="true" />
          <div className="hm-hero__phone-floor" aria-hidden="true" />
          <button
            type="button"
            className="hm-hero__phonebtn"
            onClick={replayInvitation}
            aria-label={open ? t('replay') : t('cta')}
          >
            <Phone label={t('phone.label')}>
              <RiwaqPhone
                names={shownNames}
                dateText={dateText}
                line={t('phone.line')}
                tapHint={open ? t('replayHint') : t('phone.open')}
                open={open}
                dir={dir}
                lang={locale}
              />
            </Phone>
          </button>
        </div>

        <div className="hm-hero__interactive">
          <form
            className="hm-hero__form"
            onSubmit={(event) => {
              event.preventDefault();
              replayInvitation();
            }}
          >
            <div className="hm-hero__field-group">
              <label className="hm-hero__label" htmlFor="hm-hero-names">
                {t('namesLabel')}
              </label>
              <div className="hm-hero__combined">
                <input
                  id="hm-hero-names"
                  type="text"
                  name="names"
                  maxLength={MAX_NAMES}
                  autoComplete="off"
                  placeholder={t('namesPlaceholder')}
                  value={names}
                  onChange={(event) => setNames(event.target.value)}
                />
                <button type="submit" className="hm-btn hm-btn--gold hm-hero__combined-btn">
                  {open ? t('replay') : t('cta')}
                </button>
              </div>
            </div>

            <div className="hm-hero__date-wrap">
              {!showDate ? (
                <button
                  type="button"
                  className="hm-hero__date-toggle"
                  onClick={() => setShowDate(true)}
                >
                  + {t('dateLabel')}
                </button>
              ) : (
                <div className="hm-hero__date-field">
                  <label className="hm-hero__label hm-hero__label--date" htmlFor="hm-hero-date">
                    {t('dateLabel')}
                  </label>
                  <input
                    id="hm-hero-date"
                    type="date"
                    name="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
              )}
            </div>

            {names.trim().length > 0 ? (
              <div className="hm-hero__bridge" role="region" aria-label={t('bridge.label')}>
                <div className="hm-hero__bridge-bar">
                  <span className="hm-hero__bridge-note">{t('bridge.note')}</span>
                  <Link className="hm-hero__bridge-chip" href={checkoutUrl}>
                    <span>{t('bridge.action')}</span>
                    <Chevron />
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="hm-hero__actions">
              <Link className="hm-hero__demo-link" href={`/templates/${featuredSlug}`}>
                {t('demo')}
                <Chevron />
              </Link>
            </div>
          </form>

          <ul className="hm-hero__points">
            <li>
              <StarMark size={16} ring={false} />
              {t('point1')}
            </li>
            <li>
              <StarMark size={16} ring={false} />
              {t('point2')}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
