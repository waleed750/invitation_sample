import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {IconCheck, IconLock, IconStar, IconWhatsApp} from './icons';

interface CheckoutHeaderProps {
  currentStep?: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  maxReachedStep?: 1 | 2 | 3;
}

export function CheckoutHeader({
  currentStep = 1,
  onStepClick,
  maxReachedStep = 1,
}: CheckoutHeaderProps) {
  const t = useTranslations('checkout');

  const steps = [
    {num: 1 as const, key: 'details', label: t('steps.details')},
    {num: 2 as const, key: 'plan', label: t('steps.plan')},
    {num: 3 as const, key: 'pay', label: t('steps.pay')},
  ];

  return (
    <header className="checkout-nav-header">
      <div className="checkout-nav-wrap">
        <div className="checkout-nav-row">
          <div className="checkout-nav-brand">
            <Link href="/" className="checkout-brand-link" aria-label={t('brand')}>
              <span className="checkout-brand-mark"><IconStar size={28} /></span>
              <span className="checkout-brand-name">{t('brand')}</span>
            </Link>
          </div>

          <nav className="checkout-stepper" aria-label={t('steps.details')}>
            <ol className="stepper-list">
              {steps.map((step) => {
                const isCurrent = step.num === currentStep;
                const isDone = step.num < currentStep || (step.num < maxReachedStep && !isCurrent);
                const isClickable = Boolean(onStepClick && step.num <= maxReachedStep && !isCurrent);

                return (
                  <li
                    key={step.num}
                    className={`stepper-item ${isCurrent ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isClickable ? (
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => onStepClick?.(step.num)}
                      >
                        <span className="stepper-bubble">
                          {isDone ? <IconCheck size={14} /> : step.num}
                        </span>
                        <span className="stepper-label">{step.label}</span>
                      </button>
                    ) : (
                      <div className="stepper-btn">
                        <span className="stepper-bubble">
                          {isDone ? <IconCheck size={14} /> : step.num}
                        </span>
                        <span className="stepper-label">{step.label}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="checkout-nav-trust">
            <div className="trust-badge">
              <IconLock size={16} />
              <span className="trust-badge-text">{t('secure')}</span>
            </div>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noreferrer"
              className="checkout-help-link"
              aria-label={t('pay.referenceHelp')}
            >
              <IconWhatsApp size={18} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
