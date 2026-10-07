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
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shownNames = names.trim() || t('phone.defaultNames');
  const fallback = new Date(`${t('phone.defaultDate')}T12:00:00`);
  const parsed = date ? new Date(`${date}T12:00:00`) : fallback;
  const dateText = formatDate(Number.isNaN(parsed.getTime()) ? fallback : parsed, locale);

  function openInvitation() {
    window.clearTimeout(timer.current);
    if (!open) { setOpen(true); return; }
    setOpen(false);
    timer.current = window.setTimeout(() => setOpen(true), 900);
  }

  return (
    <section className="hm-hero" aria-labelledby="hm-hero-title">
      <div className="hm-wrap hm-hero__grid">
        <div className="hm-hero__copy">
          <p className="hm-hero__tag"><StarMark size={18} ring={false} />{t('tag')}</p>
          <h1 id="hm-hero-title" className="hm-hero__title"><span>{t('title1')}</span><span className="hm-hero__accent">{t('title2')}</span></h1>
          <p className="hm-hero__sub">{t('sub')}</p>
          <form className="hm-hero__form" onSubmit={(event) => { event.preventDefault(); openInvitation(); }}>
            <label className="hm-hero__field">
              <span className="hm-hero__label">{t('namesLabel')}</span>
              <input type="text" name="names" maxLength={MAX_NAMES} autoComplete="off" placeholder={t('phone.defaultNames')} value={names}
                onChange={(event) => { setNames(event.target.value); setOpen(true); }} />
            </label>
            <label className="hm-hero__field">
              <span className="hm-hero__label">{t('dateLabel')}</span>
              <input type="date" name="date" value={date} onChange={(event) => { setDate(event.target.value); setOpen(true); }} />
            </label>
            <div className="hm-hero__actions">
              <button type="submit" className="hm-btn hm-btn--primary hm-btn--big">{open ? t('replay') : t('cta')}<Chevron /></button>
              <Link className="hm-btn hm-btn--ghost hm-btn--big" href={`/templates/${featuredSlug}`}>{t('demo')}</Link>
            </div>
          </form>
          <ul className="hm-hero__points">
            <li><StarMark size={16} ring={false} />{t('point1')}</li>
            <li><StarMark size={16} ring={false} />{t('point2')}</li>
          </ul>
        </div>
        <div className="hm-hero__stage">
          <button type="button" className="hm-hero__phonebtn" onClick={openInvitation} aria-label={t('cta')}>
            <Phone label={t('phone.label')}>
              <RiwaqPhone names={shownNames} dateText={dateText} line={t('phone.line')} tapHint={t('phone.open')} open={open} dir={dir} lang={locale} />
            </Phone>
          </button>
        </div>
      </div>
    </section>
  );
}
