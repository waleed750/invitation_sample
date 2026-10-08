import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Bidi} from '@/components/Bidi';
import {CopyButton} from '@/commerce/CopyButton';
import {DemoBanner} from '@/commerce/DemoBanner';
import {IconClock, IconCross, IconStar, IconWhatsApp} from '@/commerce/icons';
import {getCommerceClient} from '@/commerce';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {formatDate, formatMoney} from '@/lib/format';

export default async function ResultPage({
  params,
}: {
  params: Promise<{locale: string; orderId: string}>;
}) {
  const {locale, orderId} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const order = await getCommerceClient().getOrder(orderId);
  if (!order) notFound();

  const t = await getTranslations('checkout.result');
  const shortCode = `#D-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <DemoBanner />
      <main className="result-page">
        {/* Status seal 96px arch-framed */}
        <div className={`status-seal is-${order.status}`} aria-hidden="true">
          {order.status === 'paid' && <IconStar size={48} className="seal-mark-gold" />}
          {order.status === 'pending' && <IconClock size={40} className="seal-mark-warning" />}
          {order.status === 'failed' && <IconCross size={40} className="seal-mark-danger" />}
        </div>

        <div className="result-heading">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{t(`${order.status}.title`)}</h1>
          <p className="result-description">{t(`${order.status}.description`)}</p>
        </div>

        <section className="result-receipt-card" aria-label={t('order')}>
          <div className="receipt-row">
            <span>{t('order')}</span>
            <div className="receipt-code-cell">
              <strong><Bidi>{shortCode}</Bidi></strong>
              <CopyButton
                value={shortCode}
                label={t('copyCode')}
                copiedLabel="✓"
                className="btn-ghost-sm"
              />
            </div>
          </div>
          <div className="receipt-row">
            <span>{t('amount')}</span>
            <strong className="receipt-amount"><Bidi>{formatMoney(order.amountEgp, locale)}</Bidi></strong>
          </div>
          <div className="receipt-row">
            <span>{t('created')}</span>
            <span><Bidi>{formatDate(order.createdAt, locale)}</Bidi></span>
          </div>
          {order.fawryReference && (
            <div className="receipt-row is-highlight">
              <span>{t('reference')}</span>
              <strong className="receipt-fawry-ref" dir="ltr">
                <Bidi>{order.fawryReference.replace(/(\d{3})(?=\d)/g, '$1 ')}</Bidi>
              </strong>
            </div>
          )}
        </section>

        {order.status === 'pending' && order.fawryReference && (
          <div className="pending-fawry-card">
            <p className="pending-instructions">{t('pending.instructions')}</p>
          </div>
        )}

        {order.status === 'paid' && (
          <section className="next-steps-section" aria-labelledby="next-steps-title">
            <h2 id="next-steps-title" className="next-steps-title">
              {t('nextStepsTitle')}
            </h2>
            <ol className="next-steps-list">
              <li className="next-step-item">
                <span className="step-num-bubble">1</span>
                <span>{t('step1')}</span>
              </li>
              <li className="next-step-item">
                <span className="step-num-bubble">2</span>
                <span>{t('step2')}</span>
              </li>
              <li className="next-step-item">
                <span className="step-num-bubble">3</span>
                <span>{t('step3')}</span>
              </li>
            </ol>
          </section>
        )}

        <div className="result-actions">
          {order.status === 'paid' && (
            <Link className="btn-primary btn-wide" href="/app">
              {t('dashboard')}
            </Link>
          )}

          {order.status === 'pending' && (
            <Link className="btn-primary btn-wide" href="/app">
              {t('dashboard')}
            </Link>
          )}

          {order.status === 'failed' && (
            <>
              <Link className="btn-primary btn-wide" href={`/checkout/pay/${order.id}`}>
                {t('tryAgain')}
              </Link>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-wide"
              >
                <IconWhatsApp size={18} />
                <span>واتساب للدعم</span>
              </a>
            </>
          )}
        </div>
      </main>
    </>
  );
}
