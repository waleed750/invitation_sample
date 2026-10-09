'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {EMAIL_PATTERN, mapAuthError, type AuthErrorKey} from './errors';
import {authClient} from './client';

const COOLDOWN_SECONDS = 30;

export function SignInForm({next, initialError}: {next: string; initialError?: 'callback'}) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKey | 'callback' | null>(initialError ?? null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function google() {
    setBusy(true);
    setError(null);
    const { error: failure } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: next
    });
    if (failure) {
      setError(mapAuthError(failure, 'send'));
      setBusy(false);
    }
  }

  async function sendCode() {
    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) return setError('invalidEmail');
    setBusy(true);
    setError(null);
    
    const { error: failure } = await authClient.emailOtp.sendVerificationOtp({
      email: address,
      type: 'sign-in'
    });
    
    setBusy(false);
    if (failure) return setError(mapAuthError(failure, 'send'));
    setCode('');
    setStep('code');
    setCooldown(COOLDOWN_SECONDS);
  }

  async function verify() {
    const token = code.trim();
    if (!/^\d{6}$/.test(token)) return setError('invalidCode');
    setBusy(true);
    setError(null);
    
    const { error: failure } = await authClient.signIn.emailOtp({
      email: email.trim(),
      otp: token
    });
    
    if (failure) {
      setBusy(false);
      return setError(mapAuthError(failure, 'verify'));
    }
    window.location.assign(next);
  }

  return (
    <div className="auth-form">
      {process.env.NEXT_PUBLIC_GOOGLE_LOGIN === '1' && (
        <>
          <button className="button auth-google" type="button" disabled={busy} onClick={() => void google()}>{t('google')}</button>
          <p className="auth-divider" aria-hidden="true"><span>{t('or')}</span></p>
        </>
      )}
      {step === 'email' ? (
        <form className="auth-step" noValidate onSubmit={(event) => { event.preventDefault(); void sendCode(); }}>
          <label>{t('emailLabel')}<input type="email" dir="ltr" inputMode="email" autoComplete="email" placeholder={t('emailPlaceholder')} value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error === 'invalidEmail'} required /></label>
          <button className="button" type="submit" disabled={busy}>{busy ? t('sending') : t('sendCode')}</button>
        </form>
      ) : (
        <form className="signin-otp auth-step" noValidate onSubmit={(event) => { event.preventDefault(); void verify(); }}>
          <p>{t('codeSent', {email: email.trim()})}</p>
          <label>{t('codeLabel')}<input dir="ltr" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} aria-invalid={error === 'invalidCode'} required /></label>
          <button className="button" type="submit" disabled={busy}>{busy ? t('verifying') : t('verify')}</button>
          <button className="auth-link" type="button" disabled={busy || cooldown > 0} onClick={() => void sendCode()}>{cooldown > 0 ? t('resendIn', {seconds: cooldown}) : t('resend')}</button>
          <button className="auth-link" type="button" disabled={busy} onClick={() => { setStep('email'); setError(null); }}>{t('changeEmail')}</button>
        </form>
      )}
      {error && <p className="dashboard-error" role="alert">{t(`errors.${error}`)}</p>}
    </div>
  );
}
