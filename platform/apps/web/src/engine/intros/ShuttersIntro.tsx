'use client';

import {useCallback, useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import type {Copy} from '@platform/shared';
import {useInvitationText} from '../InvitationLocaleContext';
import '../styles/shutters-intro.css';

type Props = {
  tapLabel?: Copy['tapLabel'];
  isOpen: boolean;
  isFinished: boolean;
  onStart: () => void;
  onFinished: () => void;
};

export default function ShuttersIntro({tapLabel, isOpen, isFinished, onStart, onFinished}: Props) {
  const text = useInvitationText();
  const t = useTranslations('engine');
  const completedRef = useRef(false);
  const finishOnce = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    if (!isOpen) {
      completedRef.current = false;
      return;
    }
    if (isFinished) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finishOnce();
      return;
    }
    const timer = window.setTimeout(finishOnce, 1800);
    return () => window.clearTimeout(timer);
  }, [finishOnce, isFinished, isOpen]);

  const label = text(tapLabel ?? t('tapOpen'));
  return (
    <button
      className={`shutters-intro ${isOpen ? 'is-open' : ''} ${isFinished ? 'is-finished' : ''}`}
      type="button"
      onClick={onStart}
      onTransitionEnd={event => {
        if (isOpen && event.propertyName === 'transform') finishOnce();
      }}
      aria-label={label}
      disabled={isFinished}
    >
      <span className="shutters-intro__panel shutters-intro__panel--start" aria-hidden="true" />
      <span className="shutters-intro__panel shutters-intro__panel--end" aria-hidden="true" />
      <span className="shutters-intro__moon" aria-hidden="true" />
      <span className="shutters-intro__label">{label}</span>
    </button>
  );
}
