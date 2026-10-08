import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {CopyButton} from '@/commerce/CopyButton';
import {
  IconCard,
  IconCash,
  IconChevron,
  IconClock,
  IconStar,
  IconWallet,
} from '@/commerce/icons';
import {Link} from '@/i18n/navigation';
import {formatDate, formatMoney} from '@/lib/format';
import {getTemplate} from '@/templates/registry';
import type {Order, PaymentMethod} from '@/commerce/types';

function MethodIcon({method}: {method: PaymentMethod}) {
  switch (method) {
    case 'wallet':
      return <IconWallet size={16} aria-hidden="true" />;
    case 'fawry':
      return <IconCash size={16} aria-hidden="true" />;
    case 'card':
    default:
      return <IconCard size={16} aria-hidden="true" />;
  }
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{locale: 'ar' | 'en'}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const [orders, tDashboard, tCheckout] = await Promise.all([
    getCommerceClient().listOrders(),
    getTranslations('dashboard'),
    getTranslations('checkout'),
  ]);

  // Sort orders: pending orders first, then most recent by createdAt
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingFawryOrders = sortedOrders.filter(
    (order) => order.status === 'pending' && order.method === 'fawry' && order.fawryReference,
  );

  function getOrderTitle(order: Order) {
    if (order.kind === 'edits') return tDashboard('orders.titleEdits');
    if (order.kind === 'extension') return tDashboard('orders.titleExtension');
    const template = getTemplate(order.templateSlug);
    const templateName =
      (typeof template?.entry.name === 'string'
        ? template?.entry.name
        : template?.entry.name[locale] ?? template?.entry.name.ar) ?? order.templateSlug;
    const tierName = tCheckout(`plan.tiers.${order.tier}.name`);
    return tDashboard('orders.titleNew', {template: templateName, tier: tierName});
  }

  return (
    <div className="orders-page-content">
      <header className="page-heading">
        <p className="eyebrow">{tDashboard('orders.eyebrow')}</p>
        <h1>{tDashboard('orders.title')}</h1>
        <p>{tDashboard('orders.description')}</p>
      </header>

      {/* Pending Fawry order top callout (Pending-first per UI design plan) */}
      {pendingFawryOrders.length > 0 && (
        <section className="pending-orders-banner" aria-label={tDashboard('orders.pendingTitle')}>
          {pendingFawryOrders.map((order) => {
            const shortCode = `#D-${order.id.slice(0, 8).toUpperCase()}`;
            return (
              <article className="pending-fawry-card" key={`pending-${order.id}`}>
                <div className="pending-fawry-header">
                  <div className="pending-fawry-badge-wrap">
                    <span className="status-badge status-badge--pending">
                      <IconClock size={14} />
                      <span>{tDashboard('orders.pendingBadge')}</span>
                    </span>
                    <span className="order-short-code">
                      <Bidi>{shortCode}</Bidi>
                    </span>
                  </div>
                  <strong className="pending-amount">
                    <Bidi>{formatMoney(order.amountEgp, locale)}</Bidi>
                  </strong>
                </div>

                <div className="pending-fawry-body">
                  <h2 className="pending-fawry-title">{tDashboard('orders.pendingTitle')}</h2>
                  <p className="pending-fawry-help">{tDashboard('orders.pendingHelp')}</p>

                  <div className="fawry-ref-highlight">
                    <div className="fawry-ref-info">
                      <span className="fawry-ref-label">{tDashboard('orders.reference')}</span>
                      <strong className="fawry-ref-number" dir="ltr">
                        <Bidi>{order.fawryReference}</Bidi>
                      </strong>
                    </div>
                    {order.fawryReference && (
                      <CopyButton
                        value={order.fawryReference}
                        label={tDashboard('orders.copyReference')}
                        copiedLabel={tDashboard('orders.copied')}
                        className="btn-secondary fawry-copy-btn"
                      />
                    )}
                  </div>

                  <div className="pending-fawry-footer">
                    <p className="deadline-notice">{tDashboard('orders.deadlineNotice')}</p>
                    <Link className="btn-primary pay-now-btn" href={`/checkout/pay/${order.id}`}>
                      <span>{tDashboard('orders.payNow')}</span>
                      <IconChevron size={18} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Empty State */}
      {sortedOrders.length === 0 ? (
        <section className="dashboard-empty-card" aria-label={tDashboard('orders.emptyTitle')}>
          <div className="empty-arch-frame" aria-hidden="true">
            <IconStar size={36} />
          </div>
          <h2 className="empty-title">{tDashboard('orders.emptyTitle')}</h2>
          <p className="empty-description">{tDashboard('orders.emptyDescription')}</p>
          <Link className="btn-primary" href="/templates">
            <span>{tDashboard('orders.emptyAction')}</span>
            <IconChevron size={18} />
          </Link>
        </section>
      ) : (
        <div className="order-list">
          {sortedOrders.map((order) => {
            const shortCode = `#D-${order.id.slice(0, 8).toUpperCase()}`;
            const title = getOrderTitle(order);

            return (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div className="order-card-identity">
                    <div className="order-card-meta">
                      <span className={`status-badge status-badge--${order.status}`}>
                        {tDashboard(`statuses.${order.status}`)}
                      </span>
                      <span className="order-code-chip">
                        <Bidi>{shortCode}</Bidi>
                        <CopyButton
                          value={shortCode}
                          label={tDashboard('orders.orderCode')}
                          copiedLabel={tDashboard('orders.copied')}
                          className="btn-ghost-mini"
                        />
                      </span>
                    </div>
                    <h2 className="order-card-title">{title}</h2>
                  </div>
                  <strong className="order-card-amount">
                    <Bidi>{formatMoney(order.amountEgp, locale)}</Bidi>
                  </strong>
                </div>

                <dl className="order-details-grid">
                  <div className="order-detail-item">
                    <dt>{tDashboard('orders.kind')}</dt>
                    <dd>{tDashboard(`orders.kinds.${order.kind}`)}</dd>
                  </div>
                  <div className="order-detail-item">
                    <dt>{tDashboard('orders.method')}</dt>
                    <dd className="order-method-dd">
                      <MethodIcon method={order.method} />
                      <span>{tDashboard(`orders.methods.${order.method}`)}</span>
                    </dd>
                  </div>
                  <div className="order-detail-item">
                    <dt>{tDashboard('orders.date')}</dt>
                    <dd>{formatDate(order.createdAt, locale)}</dd>
                  </div>

                  {order.fawryReference && order.status === 'pending' && (
                    <div className="order-detail-item fawry-row">
                      <dt>{tDashboard('orders.reference')}</dt>
                      <dd className="copy-value">
                        <Bidi>{order.fawryReference}</Bidi>
                        <CopyButton
                          value={order.fawryReference}
                          label={tDashboard('share.copy')}
                          copiedLabel={tDashboard('share.copied')}
                          className="btn-ghost-mini"
                        />
                      </dd>
                    </div>
                  )}

                  {/* Receipt: only when available (paidAt present) — no 'coming soon' is ever shown */}
                  {order.paidAt && (
                    <div className="order-detail-item">
                      <dt>{tDashboard('orders.receipt')}</dt>
                      <dd>
                        <span className="receipt-confirmed-tag">
                          {formatDate(order.paidAt, locale)}
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
