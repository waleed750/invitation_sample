'use client';

import {useEffect, useState} from 'react';

type Props = {
  names: string;
  dateText: string;
  line: string;
  tapHint: string;
  open: boolean;
  dir: 'rtl' | 'ltr';
  lang: 'ar' | 'en';
};

const MEDIA = '/assets/demo/riwaq';

// The Riwaq demo inside the hero phone: closed curtains, then the one-shot intro video, then the ambient loop,
// with the visitor's own names on top. Reduced motion skips the videos and shows the hero still.
export function RiwaqPhone({names, dateText, line, tapHint, open, dir, lang}: Props) {
  const [introDone, setIntroDone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (open) { setRound((current) => current + 1); setIntroDone(false); }
    else setIntroDone(false);
  }, [open]);

  const showHero = open && (introDone || reduced);
  return (
    <div className={`hm-rp ${open ? 'is-open' : ''} ${showHero ? 'is-hero' : ''}`} dir={dir} lang={lang}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed demo stills, sized by CSS */}
      <img className="hm-rp__layer hm-rp__poster" src={`${MEDIA}/intro-poster.jpg`} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hm-rp__layer hm-rp__still" src={`${MEDIA}/hero-poster.jpg`} alt="" />
      {open && !reduced ? (
        <video key={`intro-${round}`} className="hm-rp__layer hm-rp__intro" src={`${MEDIA}/intro-video.mp4`}
          muted playsInline autoPlay preload="auto" onEnded={() => setIntroDone(true)} onError={() => setIntroDone(true)} />
      ) : null}
      {open && !reduced ? (
        <video key={`hero-${round}`} className="hm-rp__layer hm-rp__loop" src={`${MEDIA}/hero-video.mp4`}
          poster={`${MEDIA}/hero-poster.jpg`} muted playsInline autoPlay loop preload="auto" />
      ) : null}
      <div className="hm-rp__copy">
        <p className="hm-rp__line">{line}</p>
        <p className="hm-rp__names">{names}</p>
        <p className="hm-rp__date">{dateText}</p>
      </div>
      {(!open || introDone) && tapHint ? <p className="hm-rp__hint">{tapHint}</p> : null}
    </div>
  );
}
