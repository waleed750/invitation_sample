import type {CSSProperties} from 'react';

export type InvitationVariant = 'red' | 'ink' | 'mint';

type Props = {
  names: string;
  dateText: string;
  line: string;
  place?: string;
  variant?: InvitationVariant;
  open: boolean;
  tapHint?: string;
  dir: 'rtl' | 'ltr';
  lang: 'ar' | 'en';
  className?: string;
  style?: CSSProperties;
};

// Pure presentational "envelope then card" screen, reused by the hero, the journey and the language toy.
export function InvitationScreen({names, dateText, line, place, variant = 'red', open, tapHint, dir, lang, className = '', style}: Props) {
  return (
    <div className={`lp-invite lp-invite--${variant} ${open ? 'is-open' : ''} ${className}`} dir={dir} lang={lang} style={style}>
      <div className="lp-invite__card">
        <svg className="lp-invite__arch" viewBox="0 0 120 70" aria-hidden="true"><path d="M10 70V38a50 50 0 0 1 100 0v32" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M24 70V40a36 36 0 0 1 72 0v30" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        <p className="lp-invite__line">{line}</p>
        <p className="lp-invite__names">{names}</p>
        <p className="lp-invite__date">{dateText}</p>
        {place ? <p className="lp-invite__place">{place}</p> : null}
      </div>
      <div className="lp-invite__envelope" aria-hidden="true">
        <span className="lp-invite__flap" />
        <span className="lp-invite__seal" />
      </div>
      {!open && tapHint ? <p className="lp-invite__hint">{tapHint}</p> : null}
    </div>
  );
}
