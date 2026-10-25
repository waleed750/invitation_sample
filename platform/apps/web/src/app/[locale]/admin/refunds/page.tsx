import '@/styles/admin-more.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {ActionForm} from '@/admin/more/ActionForm';
import {adminGet} from '@/admin/more/call';
import {refundManuallyAction, refundToBalanceAction} from '@/admin/more/actions';
import {formatDate} from '@/lib/format';

export const dynamic = 'force-dynamic';

interface Row {
  id: string; status: string; kind: string; tier: string; amount_minor: number; paid_amount_minor: number | null; currency: string;
  provider: string; paid_at: string | null; refunded_at: string | null; customer_email: string | null; customer_phone: string | null;
}

export default async function AdminRefundsPage({params, searchParams}: {params: Promise<{locale: 'ar' | 'en'}>; searchParams: Promise<{q?: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const {q} = await searchParams;
  const t = await getTranslations('adminMore.refunds');
  const query = q !== undefined && q.trim().length >= 2 ? `?q=${encodeURIComponent(q.trim())}` : '';
  const rows = await adminGet<Row[]>(`/v1/admin/refunds${query}`);

  return (
    <div className="am-page" data-testid="admin-refunds">
      <h1>{t('title')}</h1>
      <p>{t('help')}</p>
      <form className="am-form" method="get">
        <label>{t('search')}<input name="q" defaultValue={q ?? ''} dir="ltr" /></label>
        <div className="am-form__row"><button type="submit" className="dashboard-btn-secondary">{t('searchButton')}</button></div>
      </form>

      {rows.length === 0 && <p>{t('empty')}</p>}
      {rows.map((row) => {
        const paid = (row.paid_amount_minor ?? row.amount_minor) / 100;
        return (
          <article key={row.id} className="am-card" data-testid="refund-order" data-order={row.id} data-status={row.status}>
            <div className="am-grid">
              <div><small>{t('order')}</small><div><strong><Bidi>{`#D-${row.id.slice(0, 8).toUpperCase()}`}</Bidi></strong></div></div>
              <div><small>{t('customer')}</small><div dir="ltr"><Bidi>{row.customer_email ?? row.customer_phone ?? '—'}</Bidi></div></div>
              <div><small>{t('amount')}</small><div><strong>{paid.toFixed(2)} {row.currency}</strong></div></div>
              <div><small>{t('status')}</small><div><span className={`am-badge ${row.status === 'refunded' ? 'am-badge--retired' : 'am-badge--live'}`}>{t(`statuses.${row.status}`)}</span></div></div>
              <div><small>{t('date')}</small><div>{formatDate(row.refunded_at ?? row.paid_at ?? '', locale)}</div></div>
            </div>
            {row.status === 'paid' && (
              <div className="am-grid">
                <ActionForm action={refundToBalanceAction} submitLabel={t('toBalance')} testId="form-refund-balance">
                  <input type="hidden" name="orderId" value={row.id} />
                  <label>{t('note')}<input name="note" required minLength={3} maxLength={300} /></label>
                </ActionForm>
                <ActionForm action={refundManuallyAction} submitLabel={t('manual')} testId="form-refund-manual" danger>
                  <input type="hidden" name="orderId" value={row.id} />
                  <label>{t('manualNote')}<input name="note" required minLength={3} maxLength={500} /></label>
                </ActionForm>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
