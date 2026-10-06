'use client';

import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {formatDate} from '@/lib/format';
import {InvitationScreen} from './InvitationScreen';
import {Phone} from './Phone';
import '@/styles/lp-flip.css';

type Lang = 'ar' | 'en';
type Phase = 'idle' | 'out' | 'in';

// Illustrative dashboard numbers for the demo meter, not real statistics.
const EXAMPLE_EDITS_LEFT = 7;

export function FlipToy({editsAllowed}: {editsAllowed: number}) {
  const t = useTranslations('lp.flip');
  const locale = useLocale() as Lang;
  const [lang, setLang] = useState<Lang>(locale);
  const [phase, setPhase] = useState<Phase>('idle');
  const [names, setNames] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [date, setDate] = useState('2027-04-15');
  const timers = useRef<number[]>([]);
  useEffect(() => { const pending = timers.current; return () => pending.forEach((id) => window.clearTimeout(id)); }, []);
  // Keep the toy in step with the page language when the visitor switches it in the header.
  useEffect(() => { setLang(locale); setPhase('idle'); }, [locale]);

  function choose(next: Lang) {
    if (next === lang || phase !== 'idle') return;
    setPhase('out');
    timers.current.push(window.setTimeout(() => {
      setLang(next);
      setPhase('in');
      timers.current.push(window.setTimeout(() => setPhase('idle'), 340));
    }, 260));
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const parsed = new Date(`${date || '2027-04-15'}T12:00:00`);
  const dateText = formatDate(Number.isNaN(parsed.getTime()) ? new Date('2027-04-15T12:00:00') : parsed, lang);
  const shownNames = (names ?? '').trim() || t(`card.${lang}.names`);
  const shownPlace = (place ?? '').trim() || t(`card.${lang}.place`);

  return (
    <section className="lp-flip" id="control" aria-labelledby="lp-flip-title">
      <div className="lp-wrap lp-flip__grid">
        <div className="lp-flip__editor">
          <h2 id="lp-flip-title" className="lp-h2">{t('title')}</h2>
          <p className="lp-lead">{t('sub')}</p>
          <div className="lp-flip__panel">
            <label><span>{t('fields.names')}</span>
              <input type="text" maxLength={40} autoComplete="off" value={names ?? ''} placeholder={t(`card.${lang}.names`)} onChange={(event) => setNames(event.target.value)} />
            </label>
            <label><span>{t('fields.date')}</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label><span>{t('fields.place')}</span>
              <input type="text" maxLength={60} autoComplete="off" value={place ?? ''} placeholder={t(`card.${lang}.place`)} onChange={(event) => setPlace(event.target.value)} />
            </label>
            <div className="lp-flip__toggle" role="group" aria-label={t('toggleLabel')}>
              <button type="button" lang="ar" aria-pressed={lang === 'ar'} onClick={() => choose('ar')}>{t('ar')}</button>
              <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => choose('en')}>{t('en')}</button>
            </div>
          </div>
          <ul className="lp-flip__badges">
            <li>{t('badges.edits', {n: editsAllowed})}</li>
            <li>{t('badges.once')}</li>
            <li>{t('badges.noapp')}</li>
          </ul>
        </div>
        <div className="lp-flip__preview">
          <div className="lp-flip__stage" data-phase={phase}>
            <Phone className="lp-flip__phone" label={t('title')}>
              <InvitationScreen names={shownNames} dateText={dateText} line={t(`card.${lang}.line`)} place={shownPlace} variant="red" open dir={dir} lang={lang} />
            </Phone>
          </div>
          <div className="lp-flip__meter" role="group" aria-label={t('meter', {left: EXAMPLE_EDITS_LEFT, total: editsAllowed})}>
            <p className="lp-flip__meter-text">{t('meter', {left: EXAMPLE_EDITS_LEFT, total: editsAllowed})}</p>
            <div className="lp-flip__bar" aria-hidden="true"><span style={{inlineSize: `${(EXAMPLE_EDITS_LEFT / editsAllowed) * 100}%`}} /></div>
            <p className="lp-flip__example">{t('example')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
