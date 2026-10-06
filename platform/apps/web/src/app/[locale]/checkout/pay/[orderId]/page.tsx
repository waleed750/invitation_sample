import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Bidi} from '@/components/Bidi';
import {DemoBanner} from '@/commerce/DemoBanner';
import {PaymentControls} from '@/commerce/PaymentControls';
import {getCommerceClient} from '@/commerce';
import {routing} from '@/i18n/routing';
import {formatMoney} from '@/lib/format';

export default async function PayPage({params}: {params: Promise<{locale: string; orderId: string}>}) {
  const {locale, orderId} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const order = await getCommerceClient().getOrder(orderId);
  if (!order) notFound();
  const t = await getTranslations('checkout.pay');
  return <>
    <DemoBanner />
    <main className="gateway-page container">
      <p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p>{t('description')}</p>
      <section className="gateway-card">
        <div><span>{t('order')}</span><Bidi>{order.id}</Bidi></div>
        <div><span>{t('amount')}</span><strong><Bidi>{formatMoney(order.amountEgp, locale)}</Bidi></strong></div>
        {order.fawryReference && <div className="reference-box"><span>{t('fawryReference')}</span><strong><Bidi>{order.fawryReference}</Bidi></strong><p>{t('referenceHelp')}</p></div>}
        <PaymentControls locale={locale} orderId={order.id} hasReference={Boolean(order.fawryReference)} />
      </section>
    </main>
  </>;
}

