import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {AdminApi} from '@/admin/api';
import {formatMoney, formatDate} from '@/lib/format';
import {AdjustEntitlementForm, AdjustPointsForm} from '@/admin/customers/CustomerForms';
import {Link} from '@/i18n/navigation';

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{locale: string, id: string}>;
}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.customers');

  const api = new AdminApi();
  const detail = await api.getCustomerDetail(id);

  if (!detail) {
    notFound();
  }

  const p = detail.profile;

  return (
    <div style={{padding: '1.5rem', maxWidth: '1000px', margin: '0 auto'}}>
      <div style={{marginBottom: '2rem'}}>
        <Link href="/admin/customers" style={{color: 'var(--color-muted)', textDecoration: 'none', fontSize: '0.875rem'}}>← {t('title')}</Link>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem'}}>
        <div style={{flex: '1 1 300px', backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>{p.name || '-'}</h2>
          <div style={{color: 'var(--color-muted)', marginBottom: '0.5rem'}}>{p.phone || '-'}</div>
          <div style={{color: 'var(--color-muted)', marginBottom: '1rem'}}>{p.email || '-'}</div>
          <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-surface-sunken)', paddingTop: '1rem'}}>
            <div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-muted)'}}>{t('level')}</div>
              <div style={{fontWeight: 600, textTransform: 'capitalize'}}>{p.level}</div>
            </div>
            <div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-muted)'}}>{t('purchases')}</div>
              <div style={{fontWeight: 600}}>{p.purchasesCount}</div>
            </div>
            <div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-muted)'}}>{t('points')}</div>
              <div style={{fontWeight: 600, color: 'var(--color-secondary-strong)'}}>{p.pointsBalance}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{marginBottom: '3rem'}}>
        <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>{t('orders')}</h3>
        {detail.orders.length === 0 ? <p style={{color: 'var(--color-muted)'}}>-</p> : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.875rem'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '0.5rem'}}>ID</th>
                  <th style={{padding: '0.5rem'}}>Kind</th>
                  <th style={{padding: '0.5rem'}}>Tier</th>
                  <th style={{padding: '0.5rem'}}>Status</th>
                  <th style={{padding: '0.5rem'}}>Amount</th>
                  <th style={{padding: '0.5rem'}}>Date</th>
                </tr>
              </thead>
              <tbody>
                {detail.orders.map(o => (
                  <tr key={o.id} style={{borderBottom: '1px solid var(--color-surface-sunken)'}}>
                    <td style={{padding: '0.5rem', fontFamily: 'monospace'}}>{o.id.split('-')[0]}</td>
                    <td style={{padding: '0.5rem'}}>{o.kind}</td>
                    <td style={{padding: '0.5rem'}}>{o.tier}</td>
                    <td style={{padding: '0.5rem'}}>{o.status}</td>
                    <td style={{padding: '0.5rem'}}>{formatMoney(o.amountMinor / 100, locale as 'ar' | 'en')}</td>
                    <td style={{padding: '0.5rem'}}>{formatDate(o.createdAt, locale as 'ar' | 'en')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{marginBottom: '3rem'}}>
        <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem'}}>{t('invitations')}</h3>
        {detail.invitations.length === 0 ? <p style={{color: 'var(--color-muted)'}}>-</p> : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {detail.invitations.map(inv => (
              <div key={inv.id} style={{padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <div style={{fontWeight: 600, marginBottom: '0.25rem'}}>{inv.slug}</div>
                    <div style={{fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '0.5rem'}}>{inv.templateSlug}</div>
                    {inv.entitlement && (
                      <div style={{fontSize: '0.875rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                        <span>{t('editsUsed', {used: inv.entitlement.editsUsed, allowed: inv.entitlement.editsAllowed})}</span>
                        {inv.entitlement.onlineUntil && <span>{t('onlineUntil', {date: formatDate(inv.entitlement.onlineUntil, locale as 'ar' | 'en')})}</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <AdjustEntitlementForm customerId={id} invitationId={inv.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{marginBottom: '3rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h3 style={{fontSize: '1.25rem', fontWeight: 600}}>{t('pointsLedger')}</h3>
          <AdjustPointsForm customerId={id} />
        </div>
        {detail.pointsLedger.length === 0 ? <p style={{color: 'var(--color-muted)'}}>-</p> : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.875rem'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--color-border)'}}>
                  <th style={{padding: '0.5rem'}}>Delta</th>
                  <th style={{padding: '0.5rem'}}>Reason</th>
                  <th style={{padding: '0.5rem'}}>Date</th>
                </tr>
              </thead>
              <tbody>
                {detail.pointsLedger.map(l => (
                  <tr key={l.id} style={{borderBottom: '1px solid var(--color-surface-sunken)'}}>
                    <td style={{padding: '0.5rem', color: l.delta > 0 ? 'var(--color-success)' : 'var(--color-error)'}}>
                      {l.delta > 0 ? '+' : ''}{l.delta}
                    </td>
                    <td style={{padding: '0.5rem'}}>{l.reason}</td>
                    <td style={{padding: '0.5rem'}}>{formatDate(l.createdAt, locale as 'ar' | 'en')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
