'use client';

import {useActionState, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Bidi} from '@/components/Bidi';
import {formatMoney} from '@/lib/format';
import {confirmTopupAction, rejectTopupAction} from './admin-actions';
import type {PendingTopup} from './types';

/** Admin: pending balance top-ups, with confirm and reject forms. */
export function TopupQueue({topups, locale}: {topups: PendingTopup[]; locale: 'ar' | 'en'}) {
  const t = useTranslations('admin.topups');
  if (topups.length === 0) return <p>{t('empty')}</p>;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      {topups.map((topup) => <TopupCard key={topup.id} topup={topup} locale={locale} />)}
    </div>
  );
}

function TopupCard({topup, locale}: {topup: PendingTopup; locale: 'ar' | 'en'}) {
  const t = useTranslations('admin.topups');
  const [mode, setMode] = useState<'none' | 'confirm' | 'reject'>('none');
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmTopupAction, null);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectTopupAction, null);
  const state = (confirmState ?? rejectState) as {success?: boolean; error?: string} | null;
  const expected = topup.expectedMinor / 100;

  return (
    <article className="topup-card" data-testid="pending-topup" data-reference={topup.reference} style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '1.25rem'}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem'}}>
        <div><small>{t('reference')}</small><div><strong><Bidi>{topup.reference}</Bidi></strong></div></div>
        <div><small>{t('amount')}</small><div><strong><Bidi>{formatMoney(expected, locale)}</Bidi></strong></div></div>
        <div><small>{t('customer')}</small><div>{topup.customer?.name || '-'}<br /><small>{topup.customer?.phone || topup.customer?.email || '-'}</small></div></div>
      </div>
      {state?.error && <p role="alert" className="dashboard-error">{t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : t('errors.unknown_error')}</p>}
      <div style={{display: 'flex', gap: '.5rem', marginTop: '1rem'}}>
        {mode === 'none' ? (
          <>
            <button type="button" className="dashboard-btn-primary" onClick={() => setMode('confirm')}>{t('confirm')}</button>
            <button type="button" className="dashboard-btn-secondary" onClick={() => setMode('reject')}>{t('reject')}</button>
          </>
        ) : <button type="button" className="dashboard-btn-secondary" onClick={() => setMode('none')}>X</button>}
      </div>
      {mode === 'confirm' && (
        <form action={confirmAction} style={{display: 'grid', gap: '.6rem', marginTop: '.75rem'}}>
          <input type="hidden" name="topupId" value={topup.id} />
          <label>{t('paidAmount')}<input name="paidAmount" type="number" step="0.01" min="0.01" required defaultValue={expected.toFixed(2)} /></label>
          <label>{t('txnRef')}<input name="txnRef" type="text" required /></label>
          <label>{t('note')}<input name="note" type="text" /></label>
          <label style={{display: 'flex', gap: '.5rem'}}><input type="checkbox" name="acceptMismatch" />{t('acceptMismatch')}</label>
          <button type="submit" className="dashboard-btn-primary" disabled={confirmPending}>{t('confirm')}</button>
        </form>
      )}
      {mode === 'reject' && (
        <form action={rejectAction} style={{display: 'grid', gap: '.6rem', marginTop: '.75rem'}}>
          <input type="hidden" name="topupId" value={topup.id} />
          <label>{t('reason')}<input name="reason" type="text" required minLength={3} /></label>
          <button type="submit" className="dashboard-btn-primary" disabled={rejectPending}>{t('reject')}</button>
        </form>
      )}
    </article>
  );
}
