import React from 'react';
import {useTranslations} from 'next-intl';
import type {AdminStats} from '../api-schemas';
import {formatMoney} from '../../lib/format';

export interface KpiCardsProps {
  stats: AdminStats;
  locale: 'ar' | 'en';
}

export function KpiCards({stats, locale}: KpiCardsProps) {
  const t = useTranslations('admin.overview');

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--color-muted)',
    fontWeight: 500
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-primary)'
  };

  const moneyValueStyle: React.CSSProperties = {
    ...valueStyle,
    color: 'var(--color-secondary-strong)'
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      {/* Revenue Section */}
      <section>
        <h2 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-primary)'}}>
          {t('kpiRevenue')}
        </h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem'}}>
          <div style={cardStyle} data-testid="kpi-revenue-today">
            <span style={labelStyle}>{t('today')}</span>
            <span style={moneyValueStyle}>
              {formatMoney(stats.revenue.todayMinor / 100, locale)}
            </span>
          </div>
          <div style={cardStyle} data-testid="kpi-revenue-7d">
            <span style={labelStyle}>{t('last7d')}</span>
            <span style={moneyValueStyle}>
              {formatMoney(stats.revenue.last7dMinor / 100, locale)}
            </span>
          </div>
          <div style={cardStyle} data-testid="kpi-revenue-30d">
            <span style={labelStyle}>{t('last30d')}</span>
            <span style={moneyValueStyle}>
              {formatMoney(stats.revenue.last30dMinor / 100, locale)}
            </span>
          </div>
        </div>
      </section>

      {/* Action Queue Section */}
      <section>
        <h2 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-primary)'}}>
          {t('kpiQueue')}
        </h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem'}}>
          <div style={cardStyle} data-testid="kpi-pending-manual">
            <span style={labelStyle}>{t('pendingManualPayments')}</span>
            <span style={valueStyle}>
              <bdi dir="ltr">{stats.pendingManualPayments}</bdi>
            </span>
          </div>
          <div style={cardStyle} data-testid="kpi-unmatched-events">
            <span style={labelStyle}>{t('unmatchedPaymentEvents')}</span>
            <span style={valueStyle}>
              <bdi dir="ltr">{stats.unmatchedPaymentEvents}</bdi>
            </span>
          </div>
        </div>
      </section>

      {/* Platform Activity Section */}
      <section>
        <h2 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-primary)'}}>
          {t('kpiPlatform')}
        </h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem'}}>
          <div style={cardStyle} data-testid="kpi-active-invitations">
            <span style={labelStyle}>{t('activeInvitations')}</span>
            <span style={valueStyle}>
              <bdi dir="ltr">{stats.activeInvitations}</bdi>
            </span>
          </div>
          <div style={cardStyle} data-testid="kpi-new-signups">
            <span style={labelStyle}>{t('newSignups7d')}</span>
            <span style={valueStyle}>
              <bdi dir="ltr">{stats.newSignups7d}</bdi>
            </span>
          </div>
          <div style={cardStyle} data-testid="kpi-rsvps-7d">
            <span style={labelStyle}>{t('rsvps7d')}</span>
            <span style={valueStyle}>
              <bdi dir="ltr">{stats.rsvps7d}</bdi>
            </span>
          </div>
        </div>
      </section>

      {/* Orders by Status Section */}
      <section>
        <h2 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-primary)'}}>
          {t('kpiOrders')}
        </h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem'}}>
          <div style={cardStyle} data-testid="kpi-orders-paid">
            <span style={labelStyle}>{t('statusPaid')}</span>
            <span style={valueStyle}><bdi dir="ltr">{stats.ordersByStatus.paid}</bdi></span>
          </div>
          <div style={cardStyle} data-testid="kpi-orders-pending">
            <span style={labelStyle}>{t('statusPending')}</span>
            <span style={valueStyle}><bdi dir="ltr">{stats.ordersByStatus.pending}</bdi></span>
          </div>
          <div style={cardStyle} data-testid="kpi-orders-failed">
            <span style={labelStyle}>{t('statusFailed')}</span>
            <span style={valueStyle}><bdi dir="ltr">{stats.ordersByStatus.failed}</bdi></span>
          </div>
          <div style={cardStyle} data-testid="kpi-orders-refunded">
            <span style={labelStyle}>{t('statusRefunded')}</span>
            <span style={valueStyle}><bdi dir="ltr">{stats.ordersByStatus.refunded}</bdi></span>
          </div>
          <div style={cardStyle} data-testid="kpi-orders-expired">
            <span style={labelStyle}>{t('statusExpired')}</span>
            <span style={valueStyle}><bdi dir="ltr">{stats.ordersByStatus.expired}</bdi></span>
          </div>
          <div style={cardStyle} data-testid="kpi-orders-rejected">
            <span style={labelStyle}>{t('statusRejected')}</span>
            <span style={valueStyle}><bdi dir="ltr">{stats.ordersByStatus.rejected}</bdi></span>
          </div>
        </div>
      </section>
    </div>
  );
}
