import {describe, it, expect, vi} from 'vitest';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {KpiCards} from './KpiCards';
import type {AdminStats} from '../api-schemas';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));

const mockStats: AdminStats = {
  revenue: {
    todayMinor: 250000,
    last7dMinor: 1250000,
    last30dMinor: 4500000,
    currency: 'EGP'
  },
  ordersByStatus: {
    pending: 5,
    paid: 42,
    failed: 2,
    refunded: 1,
    expired: 4,
    rejected: 2
  },
  pendingManualPayments: 3,
  unmatchedPaymentEvents: 7,
  activeInvitations: 38,
  newSignups7d: 29,
  rsvps7d: 120
};

describe('KpiCards', () => {
  it('renders revenue, queues, platform activity, and order counts', () => {
    const markupEn = renderToStaticMarkup(<KpiCards stats={mockStats} locale="en" />);
    expect(markupEn).toContain('EGP 2,500');
    expect(markupEn).toContain('EGP 12,500');
    expect(markupEn).toContain('data-testid="kpi-pending-manual"');
    expect(markupEn).toContain('3');
    expect(markupEn).toContain('7');
    expect(markupEn).toContain('38');
    expect(markupEn).toContain('120');

    const markupAr = renderToStaticMarkup(<KpiCards stats={mockStats} locale="ar" />);
    expect(markupAr).toContain('2,500 ج.م');
    expect(markupAr).toContain('dir="ltr"');
  });
});
