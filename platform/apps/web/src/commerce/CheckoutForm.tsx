'use client';

import {useEffect, useId, useMemo, useState, useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {maxRedeemableEgp, TIER_ORDER, TIERS, type Tier} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {formatMoney} from '@/lib/format';
import {CheckoutHeader} from './CheckoutHeader';
import {DesignStrip} from './DesignStrip';
import {
  IconCard,
  IconCash,
  IconCheck,
  IconChevron,
  IconLock,
  IconPencil,
  IconShield,
  IconWallet,
  IconWhatsApp,
} from './icons';
import {SignInForm} from '@/auth/SignInForm';
import {sendOtpAction, startCheckoutAction, verifyOtpAction} from './actions';
import {quote} from './pricing';
import type {OrderKind, PaymentMethod} from './types';

type QuoteView = {subtotal: number; discount: number; total: number};

interface Props {
  locale: 'ar' | 'en';
  templateSlug: string;
  templateName: string;
  initialTier: Tier;
  kind: OrderKind;
  quotes: Record<Tier, {standard: QuoteView; welcome: QuoteView}>;
  initialFirst?: string;
  initialSecond?: string;
  initialDate?: string;
  /** Real account mode: the customer is already signed in, so no phone check and one manual payment method. */
  signedIn?: boolean;
  /** Real account mode but not signed in yet: sign in right here (email code) without leaving the page. */
  guest?: boolean;
  /** Open directly on the pay step (used when coming back from the inline sign-in). */
  initialStep?: 1 | 2 | 3;
  spendablePoints?: number;
}

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'unknown';
}

function formatDateFriendly(dateString: string, locale: 'ar' | 'en'): string {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function CheckoutForm({
  locale,
  templateSlug,
  templateName,
  initialTier,
  kind,
  quotes,
  initialFirst = '',
  initialSecond = '',
  initialDate = '',
  signedIn = false,
  guest = false,
  initialStep = 1,
  spendablePoints = 0,
}: Props) {
  const t = useTranslations('checkout');
  const demo = useTranslations('demoMode');

  const firstInputId = useId();
  const secondInputId = useId();
  const dateInputId = useId();
  const phoneInputId = useId();
  const codeInputId = useId();
  const couponInputId = useId();

  // Form fields
  const [first, setFirst] = useState(initialFirst);
  const [second, setSecond] = useState(initialSecond);
  const [eventDate, setEventDate] = useState(initialDate);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(signedIn);
  const [tier, setTier] = useState<Tier>(initialTier);
  // Signed-in (real) checkout pays by manual transfer; the API maps this to the manual provider.
  const [method, setMethod] = useState<PaymentMethod>(signedIn ? 'wallet' : 'card');

  // Coupon state: hidden by default, never pre-filled
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [couponError, setCouponError] = useState(false);

  // Sequential steps: 1: Details, 2: Plan, 3: Verify & Pay
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(initialStep);
  const [maxReachedStep, setMaxReachedStep] = useState<1 | 2 | 3>(initialStep);

  // UI state
  const [step1Error, setStep1Error] = useState('');
  const [error, setError] = useState('');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  // Date friendly echo
  const friendlyDate = useMemo(() => formatDateFriendly(eventDate, locale), [eventDate, locale]);

  // Check if date is in the past
  const isPastDate = useMemo(() => {
    if (!eventDate) return false;
    const picked = new Date(`${eventDate}T23:59:59`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return picked < today;
  }, [eventDate]);

  // Active pricing quote
  const baseQuote = useMemo(() => {
    if (appliedCoupon.trim().toUpperCase() === 'WELCOME10') {
      return quotes[tier].welcome;
    }
    return quotes[tier].standard;
  }, [appliedCoupon, quotes, tier]);
  const activeQuote = useMemo(() => pointsToRedeem > 0
    ? quote({templateSlug, tier, kind, couponCode: appliedCoupon, pointsToRedeem, balance: spendablePoints})
    : {...baseQuote, pointsSavedEgp: 0, pointsRedeemed: 0},
  [appliedCoupon, baseQuote, kind, pointsToRedeem, spendablePoints, templateSlug, tier]);
  const redeemOptions = useMemo(() => Array.from(
    {length: maxRedeemableEgp(baseQuote.subtotal, spendablePoints) / 50},
    (_, index) => (index + 1) * 100,
  ).map((points) => ({points, estimate: quote({templateSlug, tier, kind, couponCode: appliedCoupon, pointsToRedeem: points, balance: spendablePoints})}))
    .filter(({points, estimate}) => estimate.pointsRedeemed === points),
  [appliedCoupon, baseQuote.subtotal, kind, spendablePoints, templateSlug, tier]);

  // Leave guard when dirty
  useEffect(() => {
    const isDirty = Boolean(first.trim() || second.trim() || phone.trim());
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [first, second, phone]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  function run(task: () => Promise<unknown>, onSuccess?: () => void) {
    setError('');
    startTransition(() => {
      void task()
        .then(() => onSuccess?.())
        .catch((reason) => {
          const message = messageFor(reason);
          if (message.includes('insufficient_points') || message.includes('already used on another open order')) {
            setPointsToRedeem(0);
            setError('insufficient_points');
          } else setError(message);
        });
    });
  }

  function handleGoToStep2() {
    if (!first.trim() || !second.trim()) {
      setStep1Error('detailsRequired');
      return;
    }
    if (!eventDate) {
      setStep1Error('detailsRequired');
      return;
    }
    if (isPastDate) {
      setStep1Error('pastDate');
      return;
    }
    setStep1Error('');
    setActiveStep(2);
    setMaxReachedStep((prev) => (prev < 2 ? 2 : prev));
  }

  function handleGoToStep3() {
    setActiveStep(3);
    setMaxReachedStep((prev) => (prev < 3 ? 3 : prev));
  }

  function handleApplyCoupon() {
    const normalized = couponInput.trim().toUpperCase();
    if (normalized === 'WELCOME10') {
      setAppliedCoupon('WELCOME10');
      setPointsToRedeem(0);
      setCouponError(false);
    } else {
      setCouponError(true);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon('');
    setPointsToRedeem(0);
    setCouponInput('');
    setCouponError(false);
  }

  function sendCode() {
    if (!phone.trim()) {
      setError('invalid_phone');
      return;
    }
    run(
      () => sendOtpAction({phone}),
      () => {
        setOtpSent(true);
        setResendCooldown(60);
      },
    );
  }

  function verifyCode() {
    if (code.trim().length !== 6) {
      setError('invalid_code');
      return;
    }
    run(
      () => verifyOtpAction({phone, code, locale}),
      () => setVerified(true),
    );
  }

  function handlePay() {
    if (!first.trim() || !second.trim() || !eventDate) {
      setActiveStep(1);
      return setError('details_required');
    }
    if (!verified) {
      setActiveStep(3);
      return setError('phone_not_verified');
    }
    run(async () => {
      const result = await startCheckoutAction({
        locale,
        templateSlug,
        tier,
        kind,
        method,
        couponCode: appliedCoupon || undefined,
        pointsToRedeem: activeQuote.pointsRedeemed || undefined,
        couple: {first: first.trim(), second: second.trim()},
        eventDate,
      });
      if (result?.error === 'insufficient_points') {
        setPointsToRedeem(0);
        setError('insufficient_points');
      }
    });
  }

  // Step-aware mobile action
  function handleMobileAction() {
    if (activeStep === 1) {
      handleGoToStep2();
    } else if (activeStep === 2) {
      handleGoToStep3();
    } else if (activeStep === 3) {
      if (!verified) {
        if (!otpSent) {
          sendCode();
        } else {
          verifyCode();
        }
      } else {
        handlePay();
      }
    }
  }

  // Where the inline sign-in returns to: this same page, straight on the pay step, with the details kept.
  const signInNext = `/${locale}/checkout/${templateSlug}?${new URLSearchParams({
    tier,
    ...(kind === 'new' ? {} : {kind}),
    names: `${first.trim()} & ${second.trim()}`,
    date: eventDate,
    step: '3',
  }).toString()}`;

  const errorKey = error === 'insufficient_points' ? 'insufficient_points' : error.includes('invalid_phone')
    ? 'invalidPhone'
    : error.includes('invalid_code')
      ? 'invalidCode'
      : error === 'phone_not_verified'
        ? 'verifyFirst'
        : error === 'details_required'
          ? 'detailsRequired'
          : 'generic';

  return (
    <div className="checkout-experience">
      <CheckoutHeader
        currentStep={activeStep}
        maxReachedStep={maxReachedStep}
        onStepClick={(step) => setActiveStep(step)}
      />

      <div className="checkout-content-wrap">
        <DesignStrip
          templateName={templateName}
          first={first}
          second={second}
          dateText={friendlyDate}
        />

        <div className="checkout-grid">
          <div className="checkout-steps">
            {/* STEP 1: Details */}
            <section
              className={`checkout-step-card ${activeStep === 1 ? 'is-open' : 'is-collapsed'}`}
              aria-labelledby="step-1-title"
            >
              <div className="step-card__header">
                <span className={`step-bubble ${activeStep > 1 ? 'is-done' : 'is-active'}`}>
                  {activeStep > 1 ? <IconCheck size={16} /> : 1}
                </span>
                <div className="step-card__title-wrap">
                  <h2 id="step-1-title" className="step-card__title">
                    {t('steps.details')}
                  </h2>
                  {activeStep > 1 && (
                    <p className="step-card__summary">
                      {first} &amp; {second} · {friendlyDate}
                    </p>
                  )}
                </div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    className="step-edit-btn"
                    onClick={() => setActiveStep(1)}
                  >
                    <IconPencil size={14} />
                    <span>{t('details.edit')}</span>
                  </button>
                )}
              </div>

              {activeStep === 1 && (
                <div className="step-card__body">
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor={firstInputId}>{t('details.partner1')}</label>
                      <input
                        id={firstInputId}
                        value={first}
                        onChange={(e) => setFirst(e.target.value)}
                        placeholder={t('details.firstPlaceholder')}
                        autoComplete="given-name"
                        maxLength={40}
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor={secondInputId}>{t('details.partner2')}</label>
                      <input
                        id={secondInputId}
                        value={second}
                        onChange={(e) => setSecond(e.target.value)}
                        placeholder={t('details.secondPlaceholder')}
                        autoComplete="additional-name"
                        maxLength={40}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor={dateInputId}>{t('details.date')}</label>
                    <input
                      id={dateInputId}
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                    {friendlyDate && (
                      <p className={`date-echo ${isPastDate ? 'is-error' : ''}`}>
                        {friendlyDate}
                        {isPastDate && ` — ${t('details.pastDateError')}`}
                      </p>
                    )}
                  </div>

                  {step1Error && (
                    <p className="field-error-banner" role="alert">
                      {step1Error === 'pastDate'
                        ? t('details.pastDateError')
                        : t('errors.detailsRequired')}
                    </p>
                  )}

                  <div className="step-card__actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleGoToStep2}
                    >
                      <span>{t('details.next')}</span>
                      <IconChevron size={18} />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 2: Plan */}
            <section
              className={`checkout-step-card ${activeStep === 2 ? 'is-open' : activeStep > 2 ? 'is-collapsed' : 'is-locked'}`}
              aria-labelledby="step-2-title"
            >
              <div className="step-card__header">
                <span className={`step-bubble ${activeStep > 2 ? 'is-done' : activeStep === 2 ? 'is-active' : 'is-locked'}`}>
                  {activeStep > 2 ? <IconCheck size={16} /> : activeStep === 2 ? 2 : <IconLock size={14} />}
                </span>
                <div className="step-card__title-wrap">
                  <h2 id="step-2-title" className="step-card__title">
                    {t('steps.plan')}
                  </h2>
                  {activeStep > 2 && (
                    <p className="step-card__summary">
                      {t(`plan.tiers.${tier}.name`)} · {formatMoney(activeQuote.total, locale)}
                    </p>
                  )}
                </div>
                {activeStep > 2 && (
                  <button
                    type="button"
                    className="step-edit-btn"
                    onClick={() => setActiveStep(2)}
                  >
                    <IconPencil size={14} />
                    <span>{t('plan.edit')}</span>
                  </button>
                )}
              </div>

              {activeStep === 2 && (
                <div className="step-card__body">
                  <fieldset className="plan-choices" aria-label={t('plan.choose')}>
                    {TIER_ORDER.map((item) => {
                      const isSelected = tier === item;
                      const isRecommended = item === 'classic';
                      return (
                        <label
                          key={item}
                          className={`plan-card ${isSelected ? 'is-selected' : ''} ${isRecommended ? 'is-recommended' : ''}`}
                        >
                          <input
                            type="radio"
                            name="tier"
                            value={item}
                            checked={isSelected}
                            onChange={() => setTier(item)}
                          />
                          <div className="plan-card__info">
                            <div className="plan-card__headline">
                              <strong>{t(`plan.tiers.${item}.name`)}</strong>
                              {isRecommended && (
                                <span className="recommended-ribbon">
                                  {t('plan.recommendedBadge')}
                                </span>
                              )}
                            </div>
                            <small>
                              {t(`plan.tiers.${item}.feature`, {
                                edits: TIERS[item].editsAllowed,
                                months: TIERS[item].onlineMonths,
                              })}
                            </small>
                          </div>
                          <div className="plan-card__price">
                            <Bidi>{formatMoney(quotes[item].standard.subtotal, locale)}</Bidi>
                          </div>
                        </label>
                      );
                    })}
                  </fieldset>

                  <p className="plan-addons-hint">{t('plan.addons')}</p>

                  {signedIn && spendablePoints >= 100 && (
                    <div className="checkout-points-control">
                      <label htmlFor="checkout-points">{t('points.redeem')}</label>
                      <p>{t('points.available', {points: spendablePoints})}</p>
                      <select id="checkout-points" value={pointsToRedeem} onChange={(e) => setPointsToRedeem(Number(e.target.value))}>
                        <option value={0}>{t('points.none')}</option>
                        {redeemOptions.map(({points, estimate}) => (
                          <option key={points} value={points}>{t('points.option', {points, amount: formatMoney(estimate.pointsSavedEgp, locale)})}</option>
                        ))}
                      </select>
                      <small>{t('points.cap')}</small>
                    </div>
                  )}

                  {/* Coupon Disclosure: never pre-filled */}
                  <div className="coupon-disclosure">
                    {!couponOpen && !appliedCoupon && (
                      <button
                        type="button"
                        className="coupon-toggle-btn"
                        onClick={() => setCouponOpen(true)}
                      >
                        {t('plan.haveCoupon')}
                      </button>
                    )}

                    {couponOpen && !appliedCoupon && (
                      <div className="coupon-form">
                        <label htmlFor={couponInputId} className="sr-only">
                          {t('plan.coupon')}
                        </label>
                        <div className="coupon-input-row">
                          <input
                            id={couponInputId}
                            dir="ltr"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value);
                              setCouponError(false);
                            }}
                            placeholder="WELCOME10"
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleApplyCoupon}
                          >
                            {t('plan.applyCoupon')}
                          </button>
                        </div>
                        {couponError && (
                          <p className="coupon-error" role="alert">
                            {t('plan.invalidCoupon')}
                          </p>
                        )}
                      </div>
                    )}

                    {appliedCoupon && (
                      <div className="coupon-applied-banner">
                        <div className="coupon-applied-text">
                          <IconCheck size={16} />
                          <span>{t('plan.couponApplied', {code: appliedCoupon})}</span>
                        </div>
                        <button
                          type="button"
                          className="coupon-remove-btn"
                          onClick={handleRemoveCoupon}
                        >
                          {t('plan.removeCoupon')}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="step-card__actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleGoToStep3}
                    >
                      <span>{t('plan.next')}</span>
                      <IconChevron size={18} />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 3: Verify & Pay */}
            <section
              className={`checkout-step-card ${activeStep === 3 ? 'is-open' : 'is-locked'}`}
              aria-labelledby="step-3-title"
            >
              <div className="step-card__header">
                <span className={`step-bubble ${activeStep === 3 ? 'is-active' : 'is-locked'}`}>
                  {activeStep === 3 ? 3 : <IconLock size={14} />}
                </span>
                <div className="step-card__title-wrap">
                  <h2 id="step-3-title" className="step-card__title">
                    {t('steps.pay')}
                  </h2>
                </div>
              </div>

              {activeStep === 3 && (
                <div className="step-card__body">
                  {/* Phone Verification */}
                  {guest && (
                    <div className="checkout-inline-signin" data-testid="checkout-signin">
                      <p>{t('guest.lead')}</p>
                      <SignInForm next={signInNext} />
                    </div>
                  )}
                  {!signedIn && !guest && (<div className="verification-section">
                    {!verified ? (
                      <div className="verification-box">
                        <label htmlFor={phoneInputId}>{t('otp.phone')}</label>
                        <div className="phone-input-wrap">
                          <span className="phone-prefix" dir="ltr">+20</span>
                          <input
                            id={phoneInputId}
                            dir="ltr"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="010 1234 5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={otpSent}
                          />
                          {!otpSent ? (
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={pending}
                              onClick={sendCode}
                            >
                              {pending ? t('pay.processing') : t('otp.send')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => {
                                setOtpSent(false);
                                setCode('');
                              }}
                            >
                              {t('otp.changePhone')}
                            </button>
                          )}
                        </div>

                        {otpSent && (
                          <div className="otp-entry-box">
                            <p className="otp-hint">{demo('otpHint')}</p>
                            <label htmlFor={codeInputId}>{t('otp.code')}</label>
                            <div className="code-input-row">
                              <input
                                id={codeInputId}
                                dir="ltr"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                placeholder="123456"
                                className="code-digits-input"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn-primary"
                                disabled={pending || code.length !== 6}
                                onClick={verifyCode}
                              >
                                {pending ? t('pay.processing') : t('otp.verify')}
                              </button>
                            </div>
                            <div className="otp-resend-row">
                              {resendCooldown > 0 ? (
                                <span className="otp-countdown">
                                  {t('otp.resendCountdown', {seconds: resendCooldown})}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="text-link-btn"
                                  onClick={sendCode}
                                >
                                  {t('otp.resend')}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="verified-chip">
                        <IconCheck size={18} />
                        <span dir="ltr">{phone}</span>
                        <span>— {t('otp.verified')}</span>
                      </div>
                    )}
                  </div>)}

                  {/* Payment Method Choice */}
                  {!signedIn && !guest && (<fieldset className="payment-choices" aria-label={t('plan.method')}>
                    <legend className="payment-choices__legend">{t('plan.method')}</legend>
                    {(['card', 'wallet', 'fawry'] as const).map((item) => (
                      <label
                        key={item}
                        className={`payment-choice-card ${method === item ? 'is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={item}
                          checked={method === item}
                          onChange={() => setMethod(item)}
                        />
                        <div className="payment-choice-icon">
                          {item === 'card' && <IconCard size={20} />}
                          {item === 'wallet' && <IconWallet size={20} />}
                          {item === 'fawry' && <IconCash size={20} />}
                        </div>
                        <span className="payment-choice-title">
                          {t(`plan.methods.${item}`)}
                        </span>
                      </label>
                    ))}
                  </fieldset>)}

                  {/* Trust badges */}
                  <div className="checkout-trust-row">
                    <div className="trust-item">
                      <IconShield size={16} />
                      <span>{t('summary.trustLine')}</span>
                    </div>
                  </div>

                  {error && (
                    <p className="error-message-banner" role="alert">
                      {t(`errors.${errorKey}`)}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Desktop Summary Column */}
          <aside className="order-summary-card" aria-labelledby="desktop-summary-title">
            <p className="summary-eyebrow">{t('summary.eyebrow')}</p>
            <h2 id="desktop-summary-title" className="summary-title">
              {t('summary.title')}
            </h2>

            <dl className="summary-list">
              <div className="summary-row">
                <dt>{templateName}</dt>
                <dd>{t(`plan.tiers.${tier}.name`)}</dd>
              </div>
              <div className="summary-row">
                <dt>{t('summary.subtotal')}</dt>
                <dd><Bidi>{formatMoney(activeQuote.subtotal, locale)}</Bidi></dd>
              </div>
              {activeQuote.discount > 0 && (
                <div className="summary-row is-discount">
                  <dt>{t('summary.discount')}</dt>
                  <dd>− <Bidi>{formatMoney(activeQuote.discount, locale)}</Bidi></dd>
                </div>
              )}
              {activeQuote.pointsSavedEgp > 0 && (
                <div className="summary-row is-discount"><dt>{t('points.saved')}</dt><dd><Bidi>{formatMoney(activeQuote.pointsSavedEgp, locale)}</Bidi></dd></div>
              )}
              <div className="summary-row is-total">
                <dt>{t('summary.total')}</dt>
                <dd><Bidi>{formatMoney(activeQuote.total, locale)}</Bidi></dd>
              </div>
            </dl>

            <button
              className="pay-cta-btn"
              type="button"
              disabled={pending || activeStep !== 3 || !verified}
              onClick={handlePay}
            >
              {pending ? (
                t('pay.processing')
              ) : activeStep !== 3 ? (
                t('summary.payNow', {amount: formatMoney(activeQuote.total, locale)})
              ) : !verified ? (
                guest ? t('summary.signInFirst') : t('summary.verifyFirst')
              ) : (
                t('summary.payNow', {amount: formatMoney(activeQuote.total, locale)})
              )}
            </button>

            <div className="summary-footer">
              <div className="summary-trust">
                <IconLock size={14} />
                <span>{t('summary.trustLine')}</span>
              </div>
              {!signedIn && <small className="demo-hint">{demo('noCharge')}</small>}
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noreferrer"
                className="summary-support-link"
              >
                <IconWhatsApp size={16} />
                <span>{t('summary.helpWhatsApp')}</span>
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (< 1024px) */}
      <div className="mobile-total-bar">
        <div className="mobile-total-bar__inner">
          <div className="mobile-total-bar__start">
            <span className="mobile-total-label">{t('summary.total')}</span>
            <strong className="mobile-total-amount">
              <Bidi>{formatMoney(activeQuote.total, locale)}</Bidi>
            </strong>
            <button
              type="button"
              className="mobile-details-toggle"
              onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
              aria-expanded={mobileSummaryOpen}
            >
              <span>{t('summary.mobileToggle')}</span>
              <IconChevron size={14} className={mobileSummaryOpen ? 'is-expanded' : ''} />
            </button>
          </div>

          <div className="mobile-total-bar__end">
            <button
              type="button"
              className="mobile-step-action-btn"
              disabled={pending}
              onClick={handleMobileAction}
            >
              {activeStep === 1 && (
                <>
                  <span>{t('details.next')}</span>
                  <IconChevron size={16} />
                </>
              )}
              {activeStep === 2 && (
                <>
                  <span>{t('plan.next')}</span>
                  <IconChevron size={16} />
                </>
              )}
              {activeStep === 3 && (
                <span>
                  {pending
                    ? t('pay.processing')
                    : !verified
                      ? t('summary.verifyFirst')
                      : t('summary.payNow', {amount: formatMoney(activeQuote.total, locale)})}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Summary Drawer */}
        {mobileSummaryOpen && (
          <div className="mobile-summary-drawer" role="dialog" aria-modal="false">
            <dl className="summary-list">
              <div className="summary-row">
                <dt>{templateName}</dt>
                <dd>{t(`plan.tiers.${tier}.name`)}</dd>
              </div>
              <div className="summary-row">
                <dt>{t('summary.subtotal')}</dt>
                <dd><Bidi>{formatMoney(activeQuote.subtotal, locale)}</Bidi></dd>
              </div>
              {activeQuote.discount > 0 && (
                <div className="summary-row is-discount">
                  <dt>{t('summary.discount')}</dt>
                  <dd>− <Bidi>{formatMoney(activeQuote.discount, locale)}</Bidi></dd>
                </div>
              )}
              {activeQuote.pointsSavedEgp > 0 && (
                <div className="summary-row is-discount"><dt>{t('points.saved')}</dt><dd><Bidi>{formatMoney(activeQuote.pointsSavedEgp, locale)}</Bidi></dd></div>
              )}
              <div className="summary-row is-total">
                <dt>{t('summary.total')}</dt>
                <dd><Bidi>{formatMoney(activeQuote.total, locale)}</Bidi></dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
