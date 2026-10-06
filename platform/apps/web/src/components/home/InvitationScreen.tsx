import type {CSSProperties} from 'react';

export type InvitationVariant = 'green' | 'ink' | 'ivory';

type Props = {
  names: string; dateText: string; line: string; place?: string; top?: string;
  variant?: InvitationVariant; open: boolean; tapHint?: string;
  dir: 'rtl' | 'ltr'; lang: 'ar' | 'en'; className?: string; style?: CSSProperties;
};

// Presentational envelope-then-card screen, reused by the hero and the template cards.
export function InvitationScreen({names, dateText, line, place, top, variant = 'green', open, tapHint, dir, lang, className = '', style}: Props) {
  return (
    <div className={`hm-invite hm-invite--${variant} ${open ? 'is-open' : ''} ${className}`} dir={dir} lang={lang} style={style}>
      <div className="hm-invite__card">
        <svg className="hm-invite__arch" viewBox="0 0 120 70" aria-hidden="true"><path d="M10 70V38a50 50 0 0 1 100 0v32" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M24 70V40a36 36 0 0 1 72 0v30" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        {top ? <p className="hm-invite__top">{top}</p> : null}
        <p className="hm-invite__line">{line}</p>
        <p className="hm-invite__names">{names}</p>
        <p className="hm-invite__date">{dateText}</p>
        {place ? <p className="hm-invite__place">{place}</p> : null}
      </div>
      <div className="hm-invite__envelope" aria-hidden="true">
        <span className="hm-invite__flap" />
        <span className="hm-invite__seal"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9.5" y="9.5" width="13" height="13" /><rect x="9.5" y="9.5" width="13" height="13" transform="rotate(45 16 16)" /></svg></span>
      </div>
      {!open && tapHint ? <p className="hm-invite__hint">{tapHint}</p> : null}
    </div>
  );
}
