import '@/styles/customer.css';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {getServerSession} from '@/auth/session';
import {getCommerceClient} from '@/commerce';
import {PrintButton} from '@/customer/PrintButton';
import {formatEgp, orderCode} from '@/customer/format';
import {formatDate} from '@/lib/format';
import {Link} from '@/i18n/navigation';
import {getTemplate} from '@/templates/registry';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({params}: {params: Promise<{locale: 'ar' | 'en'; id: string}>}) {
  const {locale, id} = await params;
  setRequestLocale(locale);

  const order = await getCommerceClient().getOrder(id);
  // A receipt exists only for an order that was actually paid.
  if (!order || order.status !== 'paid') notFound();

  const [t, tOrders, session] = await Promise.all([getTranslations('customer.receipt'), getTranslations('dashboard.orders'), getServerSession()]);
  const template = getTemplate(order.templateSlug);
  const templateName = template === undefined
    ? order.templateSlug
    : typeof template.entry.name === 'string' ? template.entry.name : template.entry.name[locale] ?? template.entry.name.ar;
  const subtotal = order.amountEgp + order.discountEgp;
  const reference = order.payment?.reference ?? order.fawryReference;

  return (
    <article className="receipt" data-testid="receipt">
      <div className="receipt-actions no-print">
        <Link className="btn-secondary" href="/app/orders">{t('back')}</Link>
        <PrintButton />
      </div>

      <header className="receipt-head">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="receipt-code"><Bidi>{orderCode(order.id)}</Bidi></p>
      </header>

      <dl className="receipt-grid">
        <div><dt>{t('date')}</dt><dd>{formatDate(order.paidAt ?? order.createdAt, locale)}</dd></div>
        {session?.email && <div><dt>{t('billedTo')}</dt><dd dir="ltr"><Bidi>{session.email}</Bidi></dd></div>}
        <div><dt>{t('item')}</dt><dd>{tOrders(`kinds.${order.kind}`)} · {templateName}</dd></div>
        <div><dt>{t('plan')}</dt><dd>{t(`tiers.${order.tier}`)}</dd></div>
        <div><dt>{t('method')}</dt><dd>{tOrders(`methods.${order.method}`)}</dd></div>
        {reference && <div><dt>{t('reference')}</dt><dd dir="ltr"><Bidi>{reference}</Bidi></dd></div>}
      </dl>

      <table className="receipt-totals">
        <tbody>
          <tr><th scope="row">{t('subtotal')}</th><td data-testid="receipt-subtotal"><Bidi>{formatEgp(subtotal, locale)}</Bidi></td></tr>
          {order.discountEgp > 0 && (
            <tr><th scope="row">{t('discount')}</th><td data-testid="receipt-discount"><Bidi>{`−${formatEgp(order.discountEgp, locale)}`}</Bidi></td></tr>
          )}
          <tr className="receipt-total"><th scope="row">{t('total')}</th><td data-testid="receipt-total"><Bidi>{formatEgp(order.amountEgp, locale)}</Bidi></td></tr>
        </tbody>
      </table>
      <p className="receipt-note">{t('note')}</p>
    </article>
  );
}
