import {getTranslations, setRequestLocale} from 'next-intl/server';
import {AdminApi} from '@/admin/api';
import {formatMoney} from '@/lib/format';
import {PaymentForms} from '@/admin/payments/PaymentForms';

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.payments');

  const api = new AdminApi();
  const payments = await api.getPendingPayments();

  return (
    <div style={{padding: '1.5rem', maxWidth: '800px', margin: '0 auto'}}>
      <h1 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary)'}}>{t('title')}</h1>
      
      {payments.length === 0 ? (
        <p style={{color: 'var(--color-muted)'}}>{t('noData')}</p>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {payments.map((payment) => (
            <div key={payment.id} style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('reference')}</div>
                  <div style={{fontWeight: 600, wordBreak: 'break-all'}}>{payment.reference || '-'}</div>
                </div>
                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('amount')}</div>
                  <div style={{fontWeight: 600, color: 'var(--color-secondary-strong)'}}>{formatMoney(payment.amountMinor / 100, locale as 'ar' | 'en')}</div>
                </div>
                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('customer')}</div>
                  <div style={{fontWeight: 600}}>{payment.customer.name || '-'}</div>
                  <div style={{fontSize: '0.875rem'}}>{payment.customer.phone || payment.customer.email || '-'}</div>
                </div>
                <div>
                  <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{t('age')}</div>
                  <div style={{fontWeight: 600}}>{t('age', {hours: payment.ageHours.toFixed(1)})}</div>
                </div>
              </div>
              
              <PaymentForms orderId={payment.id} expectedAmountMinor={payment.amountMinor} locale={locale as 'ar' | 'en'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
