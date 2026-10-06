import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {CopyButton} from '@/commerce/CopyButton';
import {formatDate, formatMoney} from '@/lib/format';

export default async function OrdersPage({params}: {params: Promise<{locale: 'ar' | 'en'}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const [orders, t] = await Promise.all([getCommerceClient().listOrders(), getTranslations('dashboard')]);
  return <><header className="page-heading"><p className="eyebrow">{t('orders.eyebrow')}</p><h1>{t('orders.title')}</h1><p>{t('orders.description')}</p></header>{orders.length === 0 ? <section className="dashboard-empty compact"><h3>{t('orders.emptyTitle')}</h3><p>{t('orders.emptyDescription')}</p></section> : <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-heading"><div><span className={`status-badge ${order.status}`}>{t(`statuses.${order.status}`)}</span><h2><Bidi>{order.id}</Bidi></h2></div><strong><Bidi>{formatMoney(order.amountEgp, locale)}</Bidi></strong></div><dl className="details-list"><div><dt>{t('orders.kind')}</dt><dd>{t(`orders.kinds.${order.kind}`)}</dd></div><div><dt>{t('orders.method')}</dt><dd>{t(`orders.methods.${order.method}`)}</dd></div><div><dt>{t('orders.date')}</dt><dd>{formatDate(order.createdAt, locale)}</dd></div>{order.fawryReference && <div><dt>{t('orders.reference')}</dt><dd className="copy-value"><Bidi>{order.fawryReference}</Bidi><CopyButton value={order.fawryReference} label={t('share.copy')} copiedLabel={t('share.copied')} /></dd></div>}<div><dt>{t('orders.receipt')}</dt><dd>{t('orders.receiptSoon')}</dd></div></dl></article>)}</div>}</>;
}
