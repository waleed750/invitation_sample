import {describe, it, expect, vi} from 'vitest';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PaymentForms} from './PaymentForms';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: () => [null, () => {}, false],
    useState: () => [true, () => {}] // force showConfirm and showReject to be true for rendering forms
  };
});

describe('PaymentForms', () => {
  it('renders forms with prefilled major amount', () => {
    const markup = renderToStaticMarkup(<PaymentForms orderId="123" expectedAmountMinor={5000} locale="en" />);
    // Check that there is an input with name="paidAmountMajor" and value="50"
    expect(markup).toContain('name="paidAmountMajor"');
    expect(markup).toContain('value="50"');
  });
});
