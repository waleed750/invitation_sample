import '@/styles/admin-more.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ActionForm} from '@/admin/more/ActionForm';
import {adminGet} from '@/admin/more/call';
import {createAffiliateAction} from '@/admin/more/actions';
import {Link} from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

interface Row {id: string; name: string; ref_code: string; commission_pct: number; customer_discount_pct: number; active: boolean; phone: string | null}

export default async function AdminAffiliatesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('adminMore.affiliates');
  const rows = await adminGet<Row[]>('/v1/admin/affiliates');

  return (
    <div className="am-page" data-testid="admin-affiliates">
      <h1>{t('title')}</h1>
      <section className="am-card">
        <h2>{t('create')}</h2>
        <ActionForm action={createAffiliateAction} submitLabel={t('createButton')} testId="form-affiliate" resetOnSuccess>
          <div className="am-grid">
            <label>{t('name')}<input name="name" required maxLength={120} /></label>
            <label>{t('code')}<input name="refCode" required dir="ltr" pattern="[A-Za-z0-9_\-]{3,32}" autoCapitalize="none" /></label>
            <label>{t('phone')}<input name="phone" dir="ltr" inputMode="tel" /></label>
            <label>{t('commission')}<input name="commissionPct" type="number" min="0" max="100" step="0.5" defaultValue={10} /></label>
            <label>{t('customerDiscount')}<input name="customerDiscountPct" type="number" min="0" max="30" step="0.5" defaultValue={0} /></label>
            <label>{t('payoutMethod')}<input name="payoutMethod" maxLength={40} /></label>
            <label>{t('payoutAccount')}<input name="payoutAccount" dir="ltr" maxLength={300} /></label>
          </div>
        </ActionForm>
      </section>
      <section className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead><tr><th>{t('name')}</th><th>{t('code')}</th><th>{t('commission')}</th><th>{t('status')}</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5}>{t('empty')}</td></tr>}
              {rows.map((row) => (
                <tr key={row.id} data-testid="affiliate-row" data-code={row.ref_code}>
                  <td>{row.name}</td>
                  <td className="am-mono" dir="ltr">{row.ref_code}</td>
                  <td>{row.commission_pct}%</td>
                  <td><span className={`am-badge ${row.active ? 'am-badge--live' : 'am-badge--retired'}`}>{row.active ? t('active') : t('inactive')}</span></td>
                  <td><Link href={`/admin/affiliates/${row.id}`}>{t('open')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
