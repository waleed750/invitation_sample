'use client';
import React from 'react';

import {useActionState, useState} from 'react';
import {useTranslations} from 'next-intl';
import {adjustEntitlementAction, adjustPointsAction} from './actions';

export function AdjustEntitlementForm({customerId, invitationId}: {customerId: string, invitationId: string}) {
  const t = useTranslations('admin.customers');
  const [state, action, isPending] = useActionState(adjustEntitlementAction, null);
  const [show, setShow] = useState(false);

  if (!show) {
    return <button className="dashboard-btn-secondary" onClick={() => setShow(true)} style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}>{t('adjustEntitlement')}</button>;
  }

  return (
    <form action={action} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px', marginTop: '0.5rem'}}>
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="invitationId" value={invitationId} />
      
      <div style={{display: 'flex', gap: '0.5rem'}}>
        <label style={{flex: 1}}>
          <span style={{fontSize: '0.75rem', display: 'block'}}>{t('addEdits')}</span>
          <input name="addEdits" type="number" min="0" max="100" style={{width: '100%', padding: '0.25rem'}} />
        </label>
        <label style={{flex: 1}}>
          <span style={{fontSize: '0.75rem', display: 'block'}}>{t('extendDays')}</span>
          <input name="extendDays" type="number" min="0" max="365" style={{width: '100%', padding: '0.25rem'}} />
        </label>
      </div>
      
      <label>
        <span style={{fontSize: '0.75rem', display: 'block'}}>{t('reason')}</span>
        <input name="reason" type="text" required style={{width: '100%', padding: '0.25rem'}} />
      </label>

      {state?.error && <div style={{color: 'var(--color-error)', fontSize: '0.875rem'}}>{t(`error_${state.error}` as never)}</div>}
      {state?.success && <div style={{color: 'var(--color-success)', fontSize: '0.875rem'}}>{t('success_entitlement_adjusted')}</div>}

      <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
        <button type="submit" disabled={isPending} className="dashboard-btn-primary" style={{padding: '0.25rem 0.75rem'}}>{isPending ? '...' : t('save')}</button>
        <button type="button" onClick={() => setShow(false)} className="dashboard-btn-secondary" style={{padding: '0.25rem 0.75rem'}}>X</button>
      </div>
    </form>
  );
}

export function AdjustPointsForm({customerId}: {customerId: string}) {
  const t = useTranslations('admin.customers');
  const [state, action, isPending] = useActionState(adjustPointsAction, null);
  const [show, setShow] = useState(false);

  if (!show) {
    return <button className="dashboard-btn-primary" onClick={() => setShow(true)}>{t('adjustPoints')}</button>;
  }

  return (
    <form action={action} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-surface-sunken)', borderRadius: '8px', marginBottom: '1.5rem'}}>
      <input type="hidden" name="customerId" value={customerId} />
      
      <label>
        <span style={{fontSize: '0.875rem', display: 'block'}}>{t('delta')}</span>
        <input name="delta" type="number" required style={{width: '100%', padding: '0.5rem'}} />
      </label>
      
      <label>
        <span style={{fontSize: '0.875rem', display: 'block'}}>{t('reason')}</span>
        <input name="reason" type="text" required style={{width: '100%', padding: '0.5rem'}} />
      </label>

      {state?.error && <div style={{color: 'var(--color-error)', fontSize: '0.875rem'}}>{t(`error_${state.error}` as never)}</div>}
      {state?.success && <div style={{color: 'var(--color-success)', fontSize: '0.875rem'}}>{t('success_points_adjusted')}</div>}

      <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
        <button type="submit" disabled={isPending} className="dashboard-btn-primary">{isPending ? '...' : t('save')}</button>
        <button type="button" onClick={() => setShow(false)} className="dashboard-btn-secondary">X</button>
      </div>
    </form>
  );
}
