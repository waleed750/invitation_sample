import '@/styles/admin-more.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {ActionForm} from '@/admin/more/ActionForm';
import {adminGet} from '@/admin/more/call';
import {createCouponAction} from '@/admin/more/actions';
import {CouponToggle} from '@/admin/more/CouponToggle';
import {formatDate} from '@/lib/format';

export const dynamic = 'force-dynamic';

interface Coupon {
  code: string; percent_off: number | null; amount_off_minor: number | null; max_uses: number | null; used_count: number;
  expires_at: string | null; active: boolean;
}
interface Use {order_id: string; amount_minor: number; discount_total_minor: number; paid_at: string | null; status: string}

export default async function AdminCouponsPage({params, searchParams}: {params: Promise<{locale: 'ar' | 'en'}>; searchParams: Promise<{code?: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const {code} = await searchParams;
  const t = await getTranslations('adminMore.coupons');
  const coupons = await adminGet<Coupon[]>('/v1/admin/coupons');
  const uses = code !== undefined && /^[a-z0-9_-]{3,32}$/.test(code) ? await adminGet<Use[]>(`/v1/admin/coupons/${code}/uses`) : [];

  return (
    <div className="am-page" data-testid="admin-coupons">
      <h1>{t('title')}</h1>
      <section className="am-card">
        <h2>{t('create')}</h2>
        <ActionForm action={createCouponAction} submitLabel={t('createButton')} testId="form-coupon" resetOnSuccess>
          <div className="am-grid">
            <label>{t('code')}<input name="code" required dir="ltr" pattern="[A-Za-z0-9_\-]{3,32}" autoCapitalize="none" /></label>
            <label>{t('percent')}<input name="percent" type="number" min="1" max="100" step="0.01" inputMode="decimal" /></label>
            <label>{t('amount')}<input name="amount" type="number" min="1" step="0.01" inputMode="decimal" /></label>
            <label>{t('maxUses')}<input name="maxUses" type="number" min="1" step="1" inputMode="numeric" /></label>
            <label>{t('expires')}<input name="expiresAt" type="date" /></label>
          </div>
          <p className="receipt-note">{t('percentOrAmount')}</p>
        </ActionForm>
      </section>

      <section className="am-card">
        <div className="am-table-wrap">
          <table className="am-table" data-testid="coupon-table">
            <thead><tr><th>{t('code')}</th><th>{t('discount')}</th><th>{t('uses')}</th><th>{t('expires')}</th><th>{t('status')}</th><th /></tr></thead>
            <tbody>
              {coupons.length === 0 && <tr><td colSpan={6}>{t('empty')}</td></tr>}
              {coupons.map((coupon) => (
                <tr key={coupon.code} data-testid="coupon-row" data-code={coupon.code}>
                  <td className="am-mono"><Bidi>{coupon.code}</Bidi></td>
                  <td>{coupon.percent_off !== null ? `${coupon.percent_off}%` : `${((coupon.amount_off_minor ?? 0) / 100).toFixed(2)}`}</td>
                  <td>{coupon.used_count}{coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}</td>
                  <td>{coupon.expires_at ? formatDate(coupon.expires_at, locale) : '—'}</td>
                  <td><span className={`am-badge ${coupon.active ? 'am-badge--live' : 'am-badge--retired'}`}>{coupon.active ? t('active') : t('inactive')}</span></td>
                  <td>
                    <CouponToggle code={coupon.code} active={coupon.active} />
                    {' '}<a href={`?code=${coupon.code}`}>{t('showUses')}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {code !== undefined && (
        <section className="am-card" data-testid="coupon-uses">
          <h2>{t('usesOf', {code})}</h2>
          {uses.length === 0 ? <p>{t('noUses')}</p> : (
            <ul>{uses.map((use) => (
              <li key={use.order_id}><Bidi>{`#D-${use.order_id.slice(0, 8).toUpperCase()}`}</Bidi> · {use.status} · {(use.discount_total_minor / 100).toFixed(2)}</li>
            ))}</ul>
          )}
        </section>
      )}
    </div>
  );
}
