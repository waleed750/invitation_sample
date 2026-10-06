'use client';

import {useEffect, useRef, useState} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Phone} from '@/components/lp/Phone';
import {InvitationScreen} from '@/components/lp/InvitationScreen';
import {formatDate, type FormatLocale} from '@/lib/format';
import {activeStepFromIntersections, clampStep, easedCount} from './journey/helpers';
import '@/styles/lp-journey.css';

// Demo figure for the host dashboard counter — illustrative, NOT a real statistic.
const EXAMPLE_COUNT = 128;

type ConfettiPiece = {x: string; d: string; r: string; w: string; h: string; drift: string; c: string};

// Fixed pseudo-random-looking sequence (no Math.random — render must be deterministic for SSR hydration).
const CONFETTI_PIECES: ConfettiPiece[] = Array.from({length: 24}, (_, i) => ({
  x: `${4 + ((i * 37) % 92)}%`,
  d: `${((i * 53) % 14) / 10}s`,
  r: `${((i * 17) % 180) - 90}deg`,
  w: `${3 + ((i * 5) % 3)}px`,
  h: `${5 + ((i * 7) % 4)}px`,
  drift: `${((i * 13) % 7) - 3}rem`,
  c: i % 3 === 0 ? 'var(--saffron)' : i % 3 === 1 ? 'var(--red)' : 'var(--paper)',
}));

function Slide({active, children}: {active: boolean; children: ReactNode}) {
  return <div className={`lp-journey__slide${active ? ' is-active' : ''}`} aria-hidden={!active}>{children}</div>;
}

/* Scene 1 — a WhatsApp chat with an outbound invitation bubble. */
function ChatScene() {
  const t = useTranslations('lp');
  return (
    <div className="lp-journey__chat" role="presentation">
      <header className="lp-journey__chat-head">
        <span className="lp-journey__chat-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="currentColor" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" fill="currentColor" /></svg>
        </span>
        <span className="lp-journey__chat-contact">{t('journey.chat.contact')}</span>
      </header>
      <div className="lp-journey__chat-body">
        <p className="lp-journey__chat-bubble">{t('journey.chat.bubble')}</p>
        <div className="lp-journey__chat-card">
          <svg className="lp-journey__chat-arch" viewBox="0 0 120 70" aria-hidden="true"><path d="M10 70V38a50 50 0 0 1 100 0v32" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          <span className="lp-journey__chat-card-title">{t('journey.chat.previewTitle')}</span>
          <span className="lp-journey__chat-card-sub">{t('journey.chat.previewSub')}</span>
        </div>
        <span className="lp-journey__chat-now">{t('journey.chat.now')}</span>
      </div>
    </div>
  );
}

/* Scene 2 — the invitation screen; the envelope opens when `open` becomes true. */
function OpenScene({open}: {open: boolean}) {
  const t = useTranslations('lp');
  const locale = useLocale() as FormatLocale;
  return (
    <div className="lp-journey__open" role="presentation">
      <InvitationScreen
        variant="red"
        open={open}
        names={t('hero.namesDefault')}
        dateText={formatDate(t('hero.dateDefault'), locale)}
        line={t('hero.inviteLine')}
        tapHint={t('journey.guest.tap')}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        lang={locale}
      />
      <svg className="lp-journey__note" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 17.5V5.6a.6.6 0 0 1 .8-.57l11 3.4a.6.6 0 0 1 .42.57v11.1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="17.6" r="2.4" fill="currentColor" />
        <circle cx="19" cy="16.4" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

/* Decorative CSS confetti burst. */
function Confetti() {
  return (
    <div className="lp-journey__confetti" aria-hidden="true">
      {CONFETTI_PIECES.map((piece, i) => (
        <span
          key={i}
          className="lp-journey__confetti-piece"
          style={{
            '--x': piece.x,
            '--d': piece.d,
            '--r': piece.r,
            '--w': piece.w,
            '--h': piece.h,
            '--drift': piece.drift,
            '--c': piece.c,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

/* Animated 0 -> EXAMPLE_COUNT counter. Runs once per activation, resets when leaving. */
function Counter({active}: {active: boolean}) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setCount(0);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(EXAMPLE_COUNT);
      return;
    }
    const start = performance.now();
    const duration = 1600;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setCount(easedCount(progress, EXAMPLE_COUNT));
      rafRef.current = progress < 1 ? requestAnimationFrame(tick) : null;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active]);

  return (
    <p className="lp-journey__count" aria-live="off">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{EXAMPLE_COUNT}</span>
    </p>
  );
}

/* Scene 3 — guest taps "yes", confetti, then the host dashboard. */
function DashScene({active}: {active: boolean}) {
  const t = useTranslations('lp');
  return (
    <div className="lp-journey__dash" role="presentation">
      <div className="lp-journey__dash-top">
        <p className="lp-journey__dash-title">{t('journey.dash.title')}</p>
      </div>
      <div className="lp-journey__dash-body">
        <div className="lp-journey__pills" aria-hidden="true">
          <span className="lp-journey__pill is-yes">{t('journey.guest.yes')}</span>
          <span className="lp-journey__pill is-no">{t('journey.guest.no')}</span>
        </div>
        <Confetti />
        <div className="lp-journey__panel">
          <Counter active={active} />
          <p className="lp-journey__dash-label">{t('journey.dash.label')}</p>
          <span className="lp-journey__dash-example">{t('journey.dash.example')}</span>
        </div>
      </div>
    </div>
  );
}

/* Reports whether the wrapped element is in the viewport's middle band. */
function useInView(rootMargin = '-15% 0px -15% 0px') {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {rootMargin});
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return {ref, inView};
}

/* Mobile variant of scene 3 — animates its counter when scrolled into view. */
function MobileDashPhone() {
  const {ref, inView} = useInView();
  return (
    <div className="lp-journey__mobile-dash" ref={ref}>
      <Phone className="lp-journey__mphone">
        <DashScene active={inView} />
      </Phone>
    </div>
  );
}

export function Journey() {
  const t = useTranslations('lp');
  const [active, setActive] = useState(1);
  const stepRefs = [
    useRef<HTMLLIElement | null>(null),
    useRef<HTMLLIElement | null>(null),
    useRef<HTMLLIElement | null>(null),
  ];

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const next = activeStepFromIntersections(entries.map((entry) => ({
          step: Number((entry.target as HTMLElement).dataset.step),
          ratio: entry.intersectionRatio,
          isIntersecting: entry.isIntersecting,
        })));
        if (next > 0) setActive(clampStep(next));
      },
      {rootMargin: '-45% 0px -45% 0px'}
    );
    stepRefs.forEach((ref) => { if (ref.current) io.observe(ref.current); });
    return () => io.disconnect();
    // stepRefs is a stable, module-local array of refs — observe once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="lp-journey" id="journey" aria-labelledby="lp-journey-title">
      <div className="lp-wrap lp-journey__head">
        <h2 id="lp-journey-title" className="lp-h2">{t('journey.title')}</h2>
      </div>

      <div className="lp-wrap lp-journey__grid">
        <ol className="lp-journey__steps">
          {[1, 2, 3].map((n) => (
            <li className="lp-journey__step" key={n} data-step={n} ref={stepRefs[n - 1]}>
              <span className="lp-journey__numeral" aria-hidden="true">{n}</span>
              <p className="lp-journey__kicker">{t('journey.step', {n})}</p>
              <h3 className="lp-journey__title">{t(`journey.s${n}.title`)}</h3>
              <p className="lp-journey__body">{t(`journey.s${n}.body`)}</p>
            </li>
          ))}
        </ol>

        <div className="lp-journey__scene" aria-hidden="true">
          <Phone className="lp-journey__phone">
            <Slide active={active === 1}><ChatScene /></Slide>
            <Slide active={active === 2}><OpenScene open={active >= 2} /></Slide>
            <Slide active={active === 3}><DashScene active={active === 3} /></Slide>
          </Phone>
        </div>
      </div>

      <ol className="lp-journey__stack">
        {[1, 2, 3].map((n) => (
          <li className="lp-journey__mstep" key={n}>
            <div className="lp-wrap lp-journey__mblock">
              <span className="lp-journey__numeral" aria-hidden="true">{n}</span>
              <p className="lp-journey__kicker">{t('journey.step', {n})}</p>
              <h3 className="lp-journey__title">{t(`journey.s${n}.title`)}</h3>
              <p className="lp-journey__body">{t(`journey.s${n}.body`)}</p>
              <div className="lp-journey__mphone-wrap" aria-hidden="true">
                {n === 1 ? <Phone className="lp-journey__mphone"><ChatScene /></Phone>
                  : n === 2 ? <Phone className="lp-journey__mphone"><OpenScene open /></Phone>
                  : <MobileDashPhone />}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}