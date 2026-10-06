'use client';

import {useMemo, useState, useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {TIER_ORDER, TIERS, type Tier} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {formatMoney} from '@/lib/format';
import {sendOtpAction, startCheckoutAction, verifyOtpAction} from './actions';
import type {OrderKind, PaymentMethod} from './types';

type QuoteView = {subtotal: number; discount: number; total: number};
type Props = {
  locale: 'ar' | 'en';
  templateSlug: string;
  initialTier: Tier;
  kind: OrderKind;
  quotes: Record<Tier, {standard: QuoteView; welcome: QuoteView}>;
};

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'unknown';
}

export function CheckoutForm({locale, templateSlug, initialTier, kind, quotes}: Props) {
  const t = useTranslations('checkout');
  const demo = useTranslations('demoMode');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tier, setTier] = useState<Tier>(initialTier);
  const [coupon, setCoupon] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const activeQuote = useMemo(
    () => coupon.trim().toUpperCase() === 'WELCOME10' ? quotes[tier].welcome : quotes[tier].standard,
    [coupon, quotes, tier],
  );

  function run(task: () => Promise<unknown>, onSuccess?: () => void) {
    setError('');
    startTransition(() => {
      void task().then(() => onSuccess?.()).catch((reason) => setError(messageFor(reason)));
    });
  }

  function sendCode() {
    run(() => sendOtpAction({phone}), () => setOtpSent(true));
  }

  function verifyCode() {
    run(() => verifyOtpAction({phone, code, locale}), () => setVerified(true));
  }

  function pay() {
    if (!first.trim() || !second.trim() || !eventDate) return setError('details_required');
    if (!verified) return setError('phone_not_verified');
    run(() => startCheckoutAction({
      locale, templateSlug, tier, kind, method,
      couponCode: coupon || undefined,
      couple: {first, second}, eventDate,
    }));
  }

  const errorKey = error.includes('invalid_phone') ? 'invalidPhone'
    : error.includes('invalid_code') ? 'invalidCode'
      : error === 'phone_not_verified' ? 'verifyFirst'
        : error === 'details_required' ? 'detailsRequired'
          : 'generic';

  return (
    <div className="checkout-grid">
      <div className="checkout-steps">
        <details className="checkout-step" open>
          <summary><span>1</span><strong>{t('steps.details')}</strong></summary>
          <div className="step-content">
            <div className="field-row">
              <label>{t('details.first')}<input value={first} onChange={(event) => setFirst(event.target.value)} autoComplete="given-name" required /></label>
              <label>{t('details.second')}<input value={second} onChange={(event) => setSecond(event.target.value)} autoComplete="additional-name" required /></label>
            </div>
            <label>{t('details.date')}<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required /></label>
            <div className="mini-preview" aria-live="polite">
              <span>{t('details.preview')}</span>
              <strong>{first || t('details.firstPlaceholder')} <i>&amp;</i> {second || t('details.secondPlaceholder')}</strong>
              <Bidi>{eventDate || '—'}</Bidi>
            </div>
          </div>
        </details>

        <details className="checkout-step" open>
          <summary><span>2</span><strong>{t('steps.phone')}</strong></summary>
          <div className="step-content">
            <label>{t('otp.phone')}<input dir="ltr" inputMode="tel" autoComplete="tel" placeholder="010 1234 5678" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <button className="button secondary-button" type="button" disabled={pending} onClick={sendCode}>{t('otp.send')}</button>
            {otpSent && <div className="otp-panel"><p>{demo('otpHint')}</p><label>{t('otp.code')}<input dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value)} /></label><button className="button secondary-button" type="button" disabled={pending} onClick={verifyCode}>{t('otp.verify')}</button></div>}
            {verified && <p className="success-message" role="status">✓ {t('otp.verified')}</p>}
          </div>
        </details>

        <details className="checkout-step" open>
          <summary><span>3</span><strong>{t('steps.plan')}</strong></summary>
          <div className="step-content">
            <fieldset className="choice-grid"><legend>{t('plan.choose')}</legend>{TIER_ORDER.map((item) => (
              <label className={`choice-card ${tier === item ? 'selected' : ''}`} key={item}>
                <input type="radio" name="tier" value={item} checked={tier === item} onChange={() => setTier(item)} />
                <span><strong>{t(`plan.tiers.${item}.name`)}</strong><small>{t(`plan.tiers.${item}.feature`, {edits: TIERS[item].editsAllowed, months: TIERS[item].onlineMonths})}</small></span>
                <Bidi>{formatMoney(quotes[item].standard.subtotal, locale)}</Bidi>
              </label>
            ))}</fieldset>
            <p className="addon-note">{t('plan.addons')}</p>
            <label>{t('plan.coupon')}<input dir="ltr" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="WELCOME10" /></label>
            <fieldset className="payment-methods"><legend>{t('plan.method')}</legend>{(['card', 'wallet', 'fawry'] as const).map((item) => (
              <label key={item}><input type="radio" name="method" value={item} checked={method === item} onChange={() => setMethod(item)} /> {t(`plan.methods.${item}`)}</label>
            ))}</fieldset>
          </div>
        </details>
        {error && <p className="error-message" role="alert">{t(`errors.${errorKey}`)}</p>}
      </div>

      <aside className="order-summary" aria-labelledby="summary-title">
        <p className="eyebrow">{t('summary.eyebrow')}</p>
        <h2 id="summary-title">{t('summary.title')}</h2>
        <dl>
          <div><dt>{t('summary.subtotal')}</dt><dd><Bidi>{formatMoney(activeQuote.subtotal, locale)}</Bidi></dd></div>
          <div><dt>{t('summary.discount')}</dt><dd>− <Bidi>{formatMoney(activeQuote.discount, locale)}</Bidi></dd></div>
          <div className="summary-total"><dt>{t('summary.total')}</dt><dd><Bidi>{formatMoney(activeQuote.total, locale)}</Bidi></dd></div>
        </dl>
        <button className="button pay-button" type="button" disabled={pending} onClick={pay}>{pending ? t('pay.processing') : t('pay.button')}</button>
        <small>{demo('noCharge')}</small>
      </aside>
    </div>
  );
}
