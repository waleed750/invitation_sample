'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';

const KEY = 'editor.onboarded';

/** Three short tips, shown once. */
export function Onboarding() {
  const t = useTranslations('editor.onboarding');
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) !== '1') setStep(0);
    } catch {
      setStep(0);
    }
  }, []);

  function finish() {
    setStep(null);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // asked again next time; harmless
    }
  }

  if (step === null) return null;
  return (
    <div className="ed-onboarding" role="dialog" aria-modal="true" aria-labelledby="ed-onb-title" data-testid="onboarding">
      <div className="ed-onboarding__card">
        <p className="ed-note">{t('count', {current: step + 1, total: 3})}</p>
        <h2 id="ed-onb-title">{t(`tip${String(step + 1)}.title`)}</h2>
        <p>{t(`tip${String(step + 1)}.body`)}</p>
        <div className="ed-onboarding__actions">
          <button type="button" className="ed-link" onClick={finish}>{t('skip')}</button>
          <button type="button" className="ed-btn ed-btn--primary" data-testid="onboarding-next" onClick={() => (step >= 2 ? finish() : setStep(step + 1))}>{step >= 2 ? t('done') : t('next')}</button>
        </div>
      </div>
    </div>
  );
}
