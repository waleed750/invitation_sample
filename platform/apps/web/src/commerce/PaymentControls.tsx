'use client';

import {useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {simulatePaymentAction} from './actions';

export function PaymentControls({locale, orderId, hasReference}: {locale: 'ar' | 'en'; orderId: string; hasReference: boolean}) {
  const t = useTranslations('checkout.pay');
  const [pending, startTransition] = useTransition();
  function simulate(outcome: 'succeed' | 'fail' | 'fawry_reference' | 'fawry_paid') {
    startTransition(() => { void simulatePaymentAction({locale, orderId, outcome}); });
  }
  return (
    <div className="gateway-actions">
      {!hasReference && <>
        <button className="button" disabled={pending} onClick={() => simulate('succeed')}>{t('succeed')}</button>
        <button className="button danger-button" disabled={pending} onClick={() => simulate('fail')}>{t('fail')}</button>
        <button className="button secondary-button" disabled={pending} onClick={() => simulate('fawry_reference')}>{t('reference')}</button>
      </>}
      {hasReference && <button className="button" disabled={pending} onClick={() => simulate('fawry_paid')}>{t('cashPaid')}</button>}
    </div>
  );
}

