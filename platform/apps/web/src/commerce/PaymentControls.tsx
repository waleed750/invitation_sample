'use client';

import {useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {IconCash, IconCheck, IconCross} from './icons';
import {simulatePaymentAction} from './actions';

export function PaymentControls({
  locale,
  orderId,
  hasReference,
}: {
  locale: 'ar' | 'en';
  orderId: string;
  hasReference: boolean;
}) {
  const t = useTranslations('checkout.pay');
  const [pending, startTransition] = useTransition();

  function simulate(outcome: 'succeed' | 'fail' | 'fawry_reference' | 'fawry_paid') {
    startTransition(() => {
      void simulatePaymentAction({locale, orderId, outcome});
    });
  }

  return (
    <div className="gateway-simulation-panel">
      <div className="simulation-header">
        <span className="simulation-badge">{t('demoBadge')}</span>
        <p className="simulation-hint">{t('description')}</p>
      </div>

      <div className="gateway-actions">
        {!hasReference && (
          <>
            <button
              className="btn-primary"
              type="button"
              disabled={pending}
              onClick={() => simulate('succeed')}
            >
              <IconCheck size={18} />
              <span>{t('succeed')}</span>
            </button>
            <button
              className="btn-danger"
              type="button"
              disabled={pending}
              onClick={() => simulate('fail')}
            >
              <IconCross size={18} />
              <span>{t('fail')}</span>
            </button>
            <button
              className="btn-secondary"
              type="button"
              disabled={pending}
              onClick={() => simulate('fawry_reference')}
            >
              <IconCash size={18} />
              <span>{t('reference')}</span>
            </button>
          </>
        )}
        {hasReference && (
          <button
            className="btn-primary"
            type="button"
            disabled={pending}
            onClick={() => simulate('fawry_paid')}
          >
            <IconCheck size={18} />
            <span>{t('cashPaid')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
