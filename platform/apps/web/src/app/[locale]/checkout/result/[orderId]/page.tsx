import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Bidi} from '@/components/Bidi';
import {DemoBanner} from '@/commerce/DemoBanner';
import {getCommerceClient} from '@/commerce';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {formatDate, formatMoney} from '@/lib/format';

export default async function ResultPage({params}: {params: Promise<{locale: string; orderId: string}>}) {
  const {locale, orderId} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const order = await getCommerceClient().getOrder(orderId);
  if (!order) notFound();
  const t = await getTranslations('checkout.result');
  return <>
    <DemoBanner />
    <main className="result-page container">
      <div className={`status-mark ${order.status}`} aria-hidden="true">{order.status === 'paid' ? '✓' : order.status === 'failed' ? '×' : '…'}</div>
      <p className="eyebrow">{t('eyebrow')}</p><h1>{t(`${order.status}.title`)}</h1><p>{t(`${order.status}.description`)}</p>
      <dl className="result-summary">
        <div><dt>{t('order')}</dt><dd><Bidi>{order.id}</Bidi></dd></div>
        <div><dt>{t('amount')}</dt><dd><Bidi>{formatMoney(order.amountEgp, locale)}</Bidi></dd></div>
        <div><dt>{t('created')}</dt><dd><Bidi>{formatDate(order.createdAt, locale)}</Bidi></dd></div>
        {order.fawryReference && <div><dt>{t('reference')}</dt><dd><Bidi>{order.fawryReference}</Bidi></dd></div>}
      </dl>
      {order.status === 'pending' && order.fawryReference && <p className="pending-instructions">{t('pending.instructions')}</p>}
      {order.status === 'paid' && <Link className="button" href="/app">{t('dashboard')}</Link>}
      {order.status === 'failed' && <Link className="button secondary-button" href={`/checkout/pay/${order.id}`}>{t('tryAgain')}</Link>}
    </main>
  </>;
}

