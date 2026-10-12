'use client';

import React, {useActionState, useState} from 'react';
import {useTranslations} from 'next-intl';
import {assignPaymentEventAction} from './actions';

interface AssignEventFormProps {
  eventId: string;
}

export function AssignEventForm({eventId}: AssignEventFormProps) {
  const t = useTranslations('admin.paymentEvents');
  const [state, formAction, isPending] = useActionState(assignPaymentEventAction, null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{marginTop: '1rem'}}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="dashboard-btn-primary"
          style={{fontSize: '0.875rem'}}
        >
          {t('assign')}
        </button>
      )}

      {isOpen && (
        <form
          action={formAction}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'var(--color-surface-alt)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)'
          }}
        >
          <input type="hidden" name="eventId" value={eventId} />

          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            <span style={{fontSize: '0.875rem', fontWeight: 600}}>{t('orderId')}</span>
            <input
              name="orderId"
              type="text"
              required
              placeholder={t('orderIdPlaceholder')}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            />
          </label>

          <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            <span style={{fontSize: '0.875rem', fontWeight: 600}}>{t('note')}</span>
            <input
              name="note"
              type="text"
              required
              placeholder={t('notePlaceholder')}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: '4px'
              }}
            />
          </label>

          {state?.error && (
            <div style={{color: 'var(--color-error)', fontSize: '0.875rem', fontWeight: 500}}>
              {/* Map 409/404 known error codes to localized messages */}
              {(() => {
                const key = `error_${state.error}` as const;
                try {
                  return t(key as never);
                } catch {
                  return t('error_unknown_error');
                }
              })()}
            </div>
          )}

          {state?.success && (
            <div style={{color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 500}}>
              {t('success_assigned')}
            </div>
          )}

          <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
            <button
              type="submit"
              disabled={isPending}
              className="dashboard-btn-primary"
              style={{fontSize: '0.875rem'}}
            >
              {isPending ? t('submitting') : t('assign')}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="dashboard-btn-secondary"
              style={{fontSize: '0.875rem'}}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
