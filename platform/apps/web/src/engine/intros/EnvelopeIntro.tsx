'use client';

import {useCallback, useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import type {Copy} from '@platform/shared';
import {useInvitationText} from '../InvitationLocaleContext';
import '../styles/envelope-intro.css';

type Props = {
  tapLabel?: Copy['tapLabel'];
  isOpen: boolean;
  isFinished: boolean;
  onStart: () => void;
  onFinished: () => void;
};

// Generic tap-to-open envelope: body, flap and a seal. Templates skin it with --env-* custom properties.
export default function EnvelopeIntro({tapLabel, isOpen, isFinished, onStart, onFinished}: Props) {
  const text = useInvitationText();
  const t = useTranslations('engine');
  const completedRef = useRef(false);
  const finishOnce = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    if (!isOpen) { completedRef.current = false; return; }
    if (isFinished) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { finishOnce(); return; }
    // The flap and the slide-away run ~1.7s; the timer is the guarantee that nobody is ever trapped.
    const timer = window.setTimeout(finishOnce, 2000);
    return () => window.clearTimeout(timer);
  }, [finishOnce, isFinished, isOpen]);

  const label = text(tapLabel ?? t('tapOpen'));
  return (
    <button
      className={`envelope-intro ${isOpen ? 'is-open' : ''} ${isFinished ? 'is-finished' : ''}`}
      type="button"
      onClick={onStart}
      aria-label={label}
      disabled={isFinished}
    >
      <span className="envelope-intro__envelope" aria-hidden="true">
        <span className="envelope-intro__flap" />
        <span className="envelope-intro__seal">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9.5" y="9.5" width="13" height="13" /><rect x="9.5" y="9.5" width="13" height="13" transform="rotate(45 16 16)" /></svg>
        </span>
      </span>
      <span className="envelope-intro__label">{label}</span>
    </button>
  );
}
