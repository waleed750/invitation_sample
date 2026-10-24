import '@/styles/admin-more.css';
import QRCode from 'qrcode';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {ActionForm} from '@/admin/more/ActionForm';
import {AffiliateActive} from '@/admin/more/AffiliateActive';
import {adminGet} from '@/admin/more/call';
import {recordPayoutAction} from '@/admin/more/actions';
import {BalanceApiError} from '@/balance/server';
import {CopyButton} from '@/commerce/CopyButton';
import {formatDate} from '@/lib/format';
import {Link} from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

interface Aff {id: string; name: string; ref_code: string; commission_pct: number; customer_discount_pct: number; active: boolean; phone: string | null; payout_method: string | null}
interface Stats {
  clicks: number; orders: number; self_referral_orders: number; commission_earned_egp: number; commission_payable_egp: number; paid_out_egp: number; payable_now_egp: number;
}
interface Payout {id: string; amount_egp: number; method: string | null; reference: string | null; paid_at: string}
interface OrderRow {order_id: string; paid_at: string; amount_minor: number; attribution: string | null; commission_minor: number; payable: boolean; self_referral: boolean}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminAffiliatePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: 'ar' | 'en'; id: string}>;
  searchParams: Promise<{from?: string; to?: string}>;
}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const {from, to} = await searchParams;
  const t = await getTranslations('adminMore.affiliates');
  const range = new URLSearchParams();
  if (from && DATE.test(from)) range.set('from', from);
  if (to && DATE.test(to)) range.set('to', to);
  const qs = range.size > 0 ? `?${range.toString()}` : '';

  let affiliate: Aff | undefined;
  try {
    const all = await adminGet<Aff[]>('/v1/admin/affiliates');
    affiliate = all.find((item) => item.id === id);
  } catch (error) {
    if (error instanceof BalanceApiError && error.status === 404) notFound();
    throw error;
  }
  if (!affiliate) notFound();
  const [stats, payouts, orders] = await Promise.all([
    adminGet<Stats>(`/v1/admin/affiliates/${id}/stats${qs}`),
    adminGet<Payout[]>(`/v1/admin/affiliates/${id}/payouts`),
    adminGet<OrderRow[]>(`/v1/admin/affiliates/${id}/orders${qs}`),
  ]);

  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const link = `${site}/${locale}/r/${affiliate.ref_code}`;
  const qr = await QRCode.toDataURL(link, {width: 512, margin: 2});

  return (
    <div className="am-page" data-testid="admin-affiliate" data-code={affiliate.ref_code}>
      <p><Link href="/admin/affiliates">{t('back')}</Link></p>
      <h1>{affiliate.name} <span className="am-badge" dir="ltr">{affiliate.ref_code}</span></h1>
      <AffiliateActive id={affiliate.id} name={affiliate.name} active={affiliate.active} />

      <section className="am-card">
        <h2>{t('shareTitle')}</h2>
        <p className="am-mono" dir="ltr" data-testid="affiliate-link"><Bidi>{link}</Bidi></p>
        <div className="am-inline">
          <CopyButton value={link} label={t('copyLink')} copiedLabel={t('copied')} className="dashboard-btn-secondary" />
          <a className="dashboard-btn-secondary" href={qr} download={`${affiliate.ref_code}-qr.png`}>{t('downloadQr')}</a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL */}
        <img className="am-qr" src={qr} alt={t('qrAlt')} width={144} height={144} />
      </section>

      <section className="am-card">
        <h2>{t('statsTitle')}</h2>
        <form className="am-form" method="get">
          <div className="am-grid">
            <label>{t('from')}<input name="from" type="date" defaultValue={from ?? ''} /></label>
            <label>{t('to')}<input name="to" type="date" defaultValue={to ?? ''} /></label>
          </div>
          <div className="am-form__row">
            <button type="submit" className="dashboard-btn-secondary">{t('apply')}</button>
            <a className="dashboard-btn-secondary" href={`/${locale}/admin/affiliates/${id}/export${qs}`} data-testid="affiliate-export">{t('exportCsv')}</a>
          </div>
        </form>
        <div className="am-stats" data-testid="affiliate-stats">
          <div className="am-stat"><small>{t('clicks')}</small><strong>{stats.clicks}</strong></div>
          <div className="am-stat"><small>{t('orders')}</small><strong>{stats.orders}</strong></div>
          <div className="am-stat"><small>{t('earned')}</small><strong>{stats.commission_earned_egp.toFixed(2)}</strong></div>
          <div className="am-stat"><small>{t('released')}</small><strong>{stats.commission_payable_egp.toFixed(2)}</strong></div>
          <div className="am-stat"><small>{t('paidOut')}</small><strong>{stats.paid_out_egp.toFixed(2)}</strong></div>
          <div className="am-stat"><small>{t('payableNow')}</small><strong data-testid="payable-now">{stats.payable_now_egp.toFixed(2)}</strong></div>
        </div>
        <p className="receipt-note">{t('windowNote')}</p>
        {stats.self_referral_orders > 0 && <p className="am-error" role="status" data-testid="self-referral">{t('selfReferral', {count: stats.self_referral_orders})}</p>}
      </section>

      <section className="am-card">
        <h2>{t('payoutTitle')}</h2>
        <ActionForm action={recordPayoutAction} submitLabel={t('markPaid')} testId="form-payout" resetOnSuccess>
          <input type="hidden" name="id" value={affiliate.id} />
          <div className="am-grid">
            <label>{t('amount')}<input name="amountEgp" type="number" min="0.01" step="0.01" max={stats.payable_now_egp} required inputMode="decimal" /></label>
            <label>{t('payoutMethod')}<input name="method" maxLength={40} defaultValue={affiliate.payout_method ?? ''} /></label>
            <label>{t('reference')}<input name="reference" maxLength={120} dir="ltr" /></label>
          </div>
        </ActionForm>
        <ul>
          {payouts.map((payout) => <li key={payout.id}>{formatDate(payout.paid_at, locale)} · {payout.amount_egp.toFixed(2)} · {payout.reference ?? '—'}</li>)}
        </ul>
      </section>

      <section className="am-card">
        <h2>{t('ordersTitle')}</h2>
        <div className="am-table-wrap">
          <table className="am-table">
            <thead><tr><th>{t('order')}</th><th>{t('paidOn')}</th><th>{t('amount')}</th><th>{t('commissionCol')}</th><th>{t('how')}</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td><Bidi>{`#D-${order.order_id.slice(0, 8).toUpperCase()}`}</Bidi></td>
                  <td>{formatDate(order.paid_at, locale)}</td>
                  <td>{(order.amount_minor / 100).toFixed(2)}</td>
                  <td>{order.self_referral ? t('flagged') : `${(order.commission_minor / 100).toFixed(2)}${order.payable ? '' : ` (${t('pending')})`}`}</td>
                  <td>{order.attribution ? t(`attribution.${order.attribution}`) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
