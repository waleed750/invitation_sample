'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {formatDate, type FormatLocale} from '@/lib/format';
import {InvitationScreen} from './InvitationScreen';
import {Phone} from './Phone';
import '@/styles/lp-hero.css';

const MAX_NAMES = 40;

export function Hero() {
  const t = useTranslations('lp.hero');
  const locale = useLocale() as FormatLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const [names, setNames] = useState<string | null>(null);
  const [date, setDate] = useState(t('dateDefault'));
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shownNames = (names ?? '').trim() || t('namesDefault');
  const parsed = date ? new Date(`${date}T12:00:00`) : null;
  const dateText = parsed && !Number.isNaN(parsed.getTime()) ? formatDate(parsed, locale) : formatDate(new Date(`${t('dateDefault')}T12:00:00`), locale);

  function openInvitation() {
    window.clearTimeout(timer.current);
    if (!open) { setOpen(true); return; }
    // Replay the envelope: close, then open again.
    setOpen(false);
    timer.current = window.setTimeout(() => setOpen(true), 900);
  }

  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-hero__copy">
        <h1 id="lp-hero-title" className="lp-hero__title">
          <span>{t('line1')}</span>
          <span className="lp-hero__accent">
            {t('line2')}
            <svg className="lp-hero__scribble" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12C40 3 70 16 110 8s80-6 120 3 54-2 67-6" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg>
          </span>
        </h1>
        <form className="lp-hero__form" onSubmit={(event) => { event.preventDefault(); openInvitation(); }}>
          <label className="lp-hero__field lp-hero__field--names">
            <span className="lp-hero__label">{t('namesLabel')}</span>
            <input
              type="text" name="names" maxLength={MAX_NAMES} autoComplete="off" placeholder={t('namesDefault')}
              value={names ?? ''}
              onChange={(event) => { setNames(event.target.value); setOpen(true); }}
            />
          </label>
          <label className="lp-hero__field lp-hero__field--date">
            <span className="lp-hero__label">{t('dateLabel')}</span>
            <input type="date" name="date" value={date} onChange={(event) => { setDate(event.target.value); setOpen(true); }} />
          </label>
          <button type="submit" className="lp-btn lp-btn--red lp-btn--big lp-hero__cta">{open ? t('replayCta') : t('openCta')}</button>
        </form>
      </div>
      <div className="lp-hero__stage">
        <span className="lp-hero__sticker" aria-hidden="true">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="3 5" /><path d="M32 70V48a18 18 0 0 1 36 0v22z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><circle cx="50" cy="52" r="4" fill="currentColor" /></svg>
        </span>
        <button type="button" className="lp-hero__phonebtn" onClick={openInvitation} aria-label={t('openCta')}>
          <Phone className="lp-hero__phone" label={t('phoneLabel')}>
            <InvitationScreen names={shownNames} dateText={dateText} line={t('inviteLine')} variant="red" open={open} tapHint={t('tapHint')} dir={dir} lang={locale} />
          </Phone>
        </button>
        <p className="lp-hero__bubble">{t('bubble')}</p>
      </div>
    </section>
  );
}
