import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Bidi} from '@/components/Bidi';
import {CheckoutHeader} from '@/commerce/CheckoutHeader';
import {CopyButton} from '@/commerce/CopyButton';
import {DemoBanner} from '@/commerce/DemoBanner';
import {PaymentControls} from '@/commerce/PaymentControls';
import {ManualPaymentBlock} from '@/commerce/ManualPaymentBlock';
import {IconClock, IconWhatsApp} from '@/commerce/icons';
import {NotSignedInError} from '@/commerce/api-errors';
import {getCommerceClient} from '@/commerce';
import {Link, redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {formatDate, formatMoney} from '@/lib/format';

export default async function PayPage({
  params,
}: {
  params: Promise<{locale: string; orderId: string}>;
}) {
  const {locale, orderId} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  let order;
  try {
    order = await getCommerceClient().getOrder(orderId);
  } catch (error) {
    if (error instanceof NotSignedInError) redirect({href: '/sign-in', locale});
    throw error;
  }
  if (!order) notFound();
  if (order.payment && order.status !== 'pending') redirect({href: `/checkout/result/${order.id}`, locale});

  const t = await getTranslations('checkout.pay');
  const shortCode = `#D-${order.id.slice(0, 8).toUpperCase()}`;

  // Deadline for Fawry: 72 hours from creation
  const deadline = new Date(new Date(order.createdAt).getTime() + 72 * 60 * 60 * 1000);
  const deadlineText = formatDate(deadline.toISOString(), locale);

  if (order.payment) {
    const m = await getTranslations('manualPay');
    const labels = {
      title: m('title'), reference: m('reference'), amount: m('amount'), methods: m('methods'), noMethods: m('noMethods'),
      deadline: m.raw('deadline') as string, hoursLeft: m.raw('hoursLeft') as string, expired: m('expired'),
      instructions: m.raw('instructions') as string, whatsapp: m.raw('whatsapp') as string, copy: m('copy'), copied: m('copied'),
    };
    return (
      <>
        <DemoBanner />
        <CheckoutHeader currentStep={3} maxReachedStep={3} />
        <main className="gateway-page">
          <div className="gateway-heading">
            <p className="eyebrow">{t('order')} <Bidi>{shortCode}</Bidi></p>
            <h1>{m('title')}</h1>
          </div>
          <section className="gateway-card">
            <ManualPaymentBlock payment={order.payment} locale={locale} labels={labels} whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER} now={new Date()} />
            <div className="gateway-footer-links" style={{marginTop: '2rem'}}>
              <Link href={`/checkout/result/${order.id}`} className="btn-secondary" style={{width: '100%', justifyContent: 'center'}}>
                {m('continue')}
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <DemoBanner />
      <CheckoutHeader currentStep={3} maxReachedStep={3} />
      <main className="gateway-page">
        <div className="gateway-heading">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
        </div>

        <section className="gateway-card" aria-labelledby="gateway-card-title">
          <h2 id="gateway-card-title" className="sr-only">{t('title')}</h2>
          <div className="gateway-summary-rows">
            <div className="gateway-row">
              <span>{t('order')}</span>
              <strong><Bidi>{shortCode}</Bidi></strong>
            </div>
            <div className="gateway-row">
              <span>{t('amount')}</span>
              <strong className="gateway-amount"><Bidi>{formatMoney(order.amountEgp, locale)}</Bidi></strong>
            </div>
          </div>

          {order.fawryReference && (
            <div className="fawry-reference-box">
              <span className="fawry-ref-label">{t('fawryReference')}</span>
              <strong className="fawry-ref-number" dir="ltr">
                <Bidi>{order.fawryReference.replace(/(\d{3})(?=\d)/g, '$1 ')}</Bidi>
              </strong>
              <div className="fawry-ref-actions">
                <CopyButton
                  value={order.fawryReference}
                  label={t('reference')}
                  copiedLabel={t('copied')}
                  className="btn-secondary"
                />
              </div>
              <div className="fawry-deadline-row">
                <IconClock size={16} />
                <span>{t('deadlineText', {date: deadlineText})}</span>
              </div>
            </div>
          )}

          <PaymentControls
            locale={locale as 'ar' | 'en'}
            orderId={order.id}
            hasReference={Boolean(order.fawryReference)}
          />

          <div className="gateway-footer-links">
            <Link href={`/checkout/${order.templateSlug}?tier=${order.tier}&kind=${order.kind}`} className="gateway-back-link">
              {t('changeMethod')}
            </Link>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noreferrer"
              className="gateway-help-link"
            >
              <IconWhatsApp size={16} />
              <span>{t('referenceHelp')}</span>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
