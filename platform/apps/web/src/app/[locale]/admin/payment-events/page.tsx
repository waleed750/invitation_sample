import React from 'react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {AdminApi} from '@/admin/api';
import {formatDate, formatMoney} from '@/lib/format';
import {AssignEventForm} from '@/admin/payment-events/AssignEventForm';

export default async function AdminPaymentEventsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.paymentEvents');

  const api = new AdminApi();
  const [unmatched, ambiguous] = await Promise.all([
    api.getPaymentEvents({status: 'unmatched', limit: 50}).catch(() => []),
    api.getPaymentEvents({status: 'ambiguous', limit: 50}).catch(() => [])
  ]);

  // Combine and sort by receivedAt descending
  const events = [...unmatched, ...ambiguous].sort((a, b) => {
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });

  return (
    <div style={{padding: '1.5rem', maxWidth: '900px', margin: '0 auto'}}>
      <h1 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary)'}}>
        {t('title')}
      </h1>

      {events.length === 0 ? (
        <p style={{color: 'var(--color-muted)'}}>{t('noData')}</p>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: event.status === 'ambiguous' ? 'var(--color-warning-tint, #fff3cd)' : 'var(--color-info-tint, #e2e3e5)',
                    color: event.status === 'ambiguous' ? 'var(--color-warning-text, #856404)' : 'var(--color-info-text, #383d41)'
                  }}
                >
                  {event.status}
                </span>
                <span style={{fontSize: '0.8125rem', color: 'var(--color-muted)'}}>
                  {formatDate(event.receivedAt, locale as 'ar' | 'en')}
                </span>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem'}}>
                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('amount')}</div>
                  <div style={{fontWeight: 600, color: 'var(--color-secondary-strong)', fontSize: '1.125rem'}}>
                    {formatMoney(event.amountMinor / 100, locale as 'ar' | 'en')}
                  </div>
                </div>

                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('sender')}</div>
                  <div style={{fontWeight: 600}}>{event.sender || '-'}</div>
                </div>

                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('reference')}</div>
                  <div style={{fontWeight: 500, wordBreak: 'break-all'}}>{event.referenceText || '-'}</div>
                </div>

                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('matchReason')}</div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{event.matchReason || '-'}</div>
                </div>
              </div>

              <AssignEventForm eventId={event.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
