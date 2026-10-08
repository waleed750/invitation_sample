'use client';

import {useState, useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {sendOtpAction, verifyOtpAction} from './actions';
import {IconChevron, IconLock, IconStar} from './icons';
import {Link} from '@/i18n/navigation';

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
    startTransition(() => {
      void task()
        .then(success)
        .catch((reason: unknown) => {
          const message = reason instanceof Error ? reason.message : '';
          setError(
            message.includes('invalid_phone')
              ? t('invalidPhone')
              : message.includes('invalid_code')
                ? t('invalidCode')
                : t('generic'),
          );
        });
    });
  }

  return (
    <div className="signin-split-layout">
      {/* SCENE PANEL (start side on desktop / banner on mobile) */}
      <section className="signin-scene-panel" aria-hidden="true">
        <div className="signin-scene-content">
          <div className="signin-scene-badge">
            <IconStar size={24} />
          </div>
          <h2 className="signin-scene-heading">{t('tagline')}</h2>
          <div className="signin-scene-mockup">
            <div className="scene-mockup-arch">
              <span className="scene-mockup-names">أحمد &amp; نور</span>
              <span className="scene-mockup-sub">دعوة زفاف رقمية</span>
            </div>
          </div>
        </div>
      </section>

      {/* FORM PANEL */}
      <main className="signin-form-panel">
        <div className="signin-card-container">
          <header className="signin-card-header">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="signin-title">{t('title')}</h1>
            <p className="signin-desc">{t('description')}</p>
          </header>

          <form
            className="signin-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (sent) {
                run(() => verifyOtpAction({phone, code, locale}), () => location.reload());
              } else {
                run(() => sendOtpAction({phone}), () => setSent(true));
              }
            }}
          >
            <div className="form-field-group">
              <label htmlFor="signin-phone" className="field-label">
                {t('phone')}
              </label>
              <div className="phone-input-wrap" dir="ltr">
                <span className="phone-prefix-chip">+20</span>
                <input
                  id="signin-phone"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="010 1234 5678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="field-input phone-input"
                  required
                />
              </div>
            </div>

            {!sent ? (
              <button
                className="btn-primary signin-submit-btn"
                type="submit"
                disabled={pending || !phone.trim()}
              >
                <span>{pending ? '...' : t('send')}</span>
                <IconChevron size={18} />
              </button>
            ) : (
              <div className="signin-otp-panel">
                <div className="demo-hint-box">
                  <IconLock size={16} />
                  <span>{demo('otpHint')}</span>
                </div>

                <div className="form-field-group">
                  <label htmlFor="signin-code" className="field-label">
                    {t('code')}
                  </label>
                  <input
                    id="signin-code"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="field-input otp-code-input"
                    required
                    autoFocus
                  />
                </div>

                <button
                  className="btn-primary signin-submit-btn"
                  type="submit"
                  disabled={pending || code.length < 6}
                >
                  <span>{pending ? '...' : t('verify')}</span>
                  <IconChevron size={18} />
                </button>
              </div>
            )}

            {error && (
              <p className="form-error-banner" role="alert">
                {error}
              </p>
            )}
          </form>

          {/* BROWSE DESIGNS PROMPT */}
          <div className="signin-designs-prompt">
            <span>{t('noInvitation')}</span>
            <Link className="text-action-link" href="/templates">
              <span>{t('browseDesigns')}</span>
              <IconChevron size={15} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
