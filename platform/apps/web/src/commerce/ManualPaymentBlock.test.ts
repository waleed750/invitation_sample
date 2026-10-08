import * as React from 'react';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ManualPaymentLabels} from './ManualPaymentBlock';

// Vitest compiles the component's JSX with the classic runtime, which expects a global React.
(globalThis as {React?: unknown}).React = React;
const {ManualPaymentBlock, hoursLeft} = await import('./ManualPaymentBlock');

const labels: ManualPaymentLabels = {
  title: 'Pay', reference: 'Ref', amount: 'Amount', methods: 'Methods', noMethods: 'None',
  deadline: 'Before {date}', hoursLeft: '{hours}h left', expired: 'Closed', instructions: 'Send proof quoting {reference}',
  whatsapp: 'Proof {reference}', copy: 'Copy', copied: 'Copied',
};
const payment = {
  reference: 'INV-4821', amountMinor: 129900, currency: 'EGP', expiresAt: '2026-10-11T10:00:00.000Z',
  methods: [{id: 'ip', label: {ar: 'انستاباي', en: 'InstaPay'}, details: {ar: 'حول على الرقم', en: 'Send to the handle'}}],
};

describe('ManualPaymentBlock', () => {
  it('shows reference, amount, localized methods, deadline and a WhatsApp link', () => {
    const html = renderToStaticMarkup(createElement(ManualPaymentBlock, {
      payment, locale: 'ar', labels, whatsappNumber: '+20 100 000 0000', now: new Date('2026-10-10T10:00:00Z'),
    }));
    expect(html).toContain('INV-4821');
    expect(html).toContain('1,299');
    expect(html).toContain('انستاباي');
    expect(html).toContain('24h left');
    expect(html).toContain('Send proof quoting INV-4821');
    expect(html).toContain('https://wa.me/201000000000?text=Proof%20INV-4821');
  });

  it('shows the closed message after expiry and a fallback when there are no methods', () => {
    const html = renderToStaticMarkup(createElement(ManualPaymentBlock, {
      payment: {...payment, methods: []}, locale: 'en', labels, now: new Date('2026-10-12T00:00:00Z'),
    }));
    expect(html).toContain('Closed');
    expect(html).toContain('None');
    expect(html).not.toContain('wa.me');
    expect(hoursLeft(payment.expiresAt, new Date('2026-10-12T00:00:00Z'))).toBe(0);
  });
});
