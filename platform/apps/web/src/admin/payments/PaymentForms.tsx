'use client';
import React from 'react';

import {useActionState, useState} from 'react';
import {useTranslations} from 'next-intl';
import {confirmPaymentAction, rejectPaymentAction} from './actions';
import {formatMoney} from '../../lib/format';

export function PaymentForms({orderId, expectedAmountMinor, locale}: {orderId: string, expectedAmountMinor: number, locale: 'ar' | 'en'}) {
  const t = useTranslations('admin.payments');
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmPaymentAction, null);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectPaymentAction, null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [acceptMismatch, setAcceptMismatch] = useState(false);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
      <div style={{display: 'flex', gap: '0.5rem'}}>
        {!showConfirm && !showReject && (
          <>
            <button className="dashboard-btn-primary" onClick={() => setShowConfirm(true)}>{t('confirm')}</button>
            <button className="dashboard-btn-secondary" onClick={() => setShowReject(true)}>{t('reject')}</button>
          </>
        )}
        {(showConfirm || showReject) && (
          <button className="dashboard-btn-secondary" onClick={() => {setShowConfirm(false); setShowReject(false);}} style={{paddingInline: '0.5rem'}}>X</button>
        )}
      </div>

      {showConfirm && (
        <form action={confirmAction} style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--color-surface-alt)', borderRadius: '8px'}}>
          <input type="hidden" name="orderId" value={orderId} />
          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            <span style={{fontSize: '0.875rem', fontWeight: 600}}>{t('paidAmount')}</span>
            <input name="paidAmountMajor" type="number" required defaultValue={expectedAmountMinor / 100} style={{padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px'}} />
          </label>
          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            <span style={{fontSize: '0.875rem', fontWeight: 600}}>{t('txnRef')}</span>
            <input name="txnRef" type="text" required style={{padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px'}} />
          </label>
          <label style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <input type="checkbox" name="acceptMismatch" checked={acceptMismatch} onChange={(e) => setAcceptMismatch(e.target.checked)} />
            <span style={{fontSize: '0.875rem'}}>{t('acceptMismatch')}</span>
          </label>
          {acceptMismatch && (
            <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
              <span style={{fontSize: '0.875rem', fontWeight: 600}}>{t('note')}</span>
              <input name="note" type="text" required style={{padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px'}} />
            </label>
          )}
          
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {confirmState?.error && <div style={{color: 'var(--color-error)'}}>{t(`error_${confirmState.error}` as any, {expected: formatMoney(expectedAmountMinor / 100, locale)})}</div>}
          {confirmState?.success && <div style={{color: 'var(--color-success)'}}>{t('success_payment_confirmed')}</div>}
          
          <button type="submit" disabled={confirmPending} className="dashboard-btn-primary" style={{marginTop: '0.5rem'}}>
            {confirmPending ? '...' : t('confirm')}
          </button>
        </form>
      )}

      {showReject && (
        <form action={rejectAction} style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--color-error-tint)', borderRadius: '8px'}}>
          <input type="hidden" name="orderId" value={orderId} />
          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            <span style={{fontSize: '0.875rem', fontWeight: 600}}>{t('reason')}</span>
            <input name="reason" type="text" required style={{padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px'}} />
          </label>
          
          {rejectState?.error && <div style={{color: 'var(--color-error)'}}>{t(`error_${rejectState.error}` as never)}</div>}
          {rejectState?.success && <div style={{color: 'var(--color-success)'}}>{t('success_payment_rejected')}</div>}
          
          <button type="submit" disabled={rejectPending} className="dashboard-btn-primary" style={{marginTop: '0.5rem', backgroundColor: 'var(--color-error)'}}>
            {rejectPending ? '...' : t('reject')}
          </button>
        </form>
      )}
    </div>
  );
}
