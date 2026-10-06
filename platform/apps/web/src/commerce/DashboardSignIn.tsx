'use client';

import {useState, useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {sendOtpAction, verifyOtpAction} from './actions';

export function DashboardSignIn({locale}: {locale: 'ar' | 'en'}) {
  const t = useTranslations('dashboard.signIn');
  const demo = useTranslations('demoMode');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<unknown>, success: () => void) {
    setError('');
    startTransition(() => void task().then(success).catch((reason: unknown) => {
      const message = reason instanceof Error ? reason.message : '';
      setError(message.includes('invalid_phone') ? t('invalidPhone') : message.includes('invalid_code') ? t('invalidCode') : t('generic'));
    }));
  }

  return (
    <main className="dashboard-signin">
      <section className="signin-card" aria-labelledby="signin-title">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 id="signin-title">{t('title')}</h1>
        <p className="signin-intro">{t('description')}</p>
        <label>{t('phone')}<input dir="ltr" inputMode="tel" autoComplete="tel" placeholder="010 1234 5678" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <button className="button" type="button" disabled={pending} onClick={() => run(() => sendOtpAction({phone}), () => setSent(true))}>{t('send')}</button>
        {sent && <div className="signin-otp"><p>{demo('otpHint')}</p><label>{t('code')}<input dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} /></label><button className="button" type="button" disabled={pending} onClick={() => run(() => verifyOtpAction({phone, code, locale}), () => location.reload())}>{t('verify')}</button></div>}
        {error && <p className="dashboard-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
