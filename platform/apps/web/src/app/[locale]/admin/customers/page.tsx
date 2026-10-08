import {getTranslations, setRequestLocale} from 'next-intl/server';
import {AdminApi} from '@/admin/api';
import {Link} from '@/i18n/navigation';

export default async function AdminCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{q?: string}>;
}) {
  const {locale} = await params;
  const {q} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('admin.customers');

  const api = new AdminApi();
  const customers = await api.getCustomers({q});

  return (
    <div style={{padding: '1.5rem', maxWidth: '1000px', margin: '0 auto'}}>
      <h1 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary)'}}>{t('title')}</h1>
      
      <form method="get" action={`/${locale}/admin/customers`} style={{display: 'flex', gap: '0.5rem', marginBottom: '2rem'}}>
        <input 
          type="search" 
          name="q" 
          defaultValue={q} 
          placeholder={t('search')} 
          style={{flex: 1, padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', maxWidth: '400px'}} 
        />
        <button type="submit" className="dashboard-btn-primary">Search</button>
      </form>

      {customers.length === 0 ? (
        <p style={{color: 'var(--color-muted)'}}>{t('noData')}</p>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'start'}}>
            <thead>
              <tr style={{borderBottom: '2px solid var(--color-border)'}}>
                <th style={{padding: '0.75rem 0.5rem'}}>{t('search')}</th>
                <th style={{padding: '0.75rem 0.5rem'}}>{t('level')}</th>
                <th style={{padding: '0.75rem 0.5rem', textAlign: 'center'}}>{t('purchases')}</th>
                <th style={{padding: '0.75rem 0.5rem', textAlign: 'center'}}>{t('points')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{borderBottom: '1px solid var(--color-surface-sunken)'}}>
                  <td style={{padding: '1rem 0.5rem'}}>
                    <Link href={`/admin/customers/${c.id}`} style={{color: 'var(--color-secondary-strong)', fontWeight: 600, textDecoration: 'none'}}>
                      {c.name || '-'}
                    </Link>
                    <div style={{fontSize: '0.875rem', color: 'var(--color-muted)'}}>{c.phone || c.email || '-'}</div>
                  </td>
                  <td style={{padding: '1rem 0.5rem', textTransform: 'capitalize'}}>{c.level}</td>
                  <td style={{padding: '1rem 0.5rem', textAlign: 'center'}}>{c.purchasesCount}</td>
                  <td style={{padding: '1rem 0.5rem', textAlign: 'center'}}>{c.pointsBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
