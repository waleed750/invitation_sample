import {Bidi} from '../components/Bidi';
import {formatDate, formatMoney, type FormatLocale} from '../lib/format';
import {CopyButton} from './CopyButton';
import type {ManualPayment} from './types';

export interface ManualPaymentLabels {
  title: string;
  reference: string;
  amount: string;
  methods: string;
  noMethods: string;
  /** Contains `{date}`. */
  deadline: string;
  /** Contains `{hours}`. */
  hoursLeft: string;
  expired: string;
  /** Contains `{reference}`. */
  instructions: string;
  /** Contains `{reference}`. */
  whatsapp: string;
  copy: string;
  copied: string;
}

/** Hours until `expiresAt`, rounded up; 0 when already past. */
export function hoursLeft(expiresAt: string, now: Date): number {
  const ms = Date.parse(expiresAt) - now.getTime();
  return Number.isFinite(ms) && ms > 0 ? Math.ceil(ms / 3_600_000) : 0;
}

/** Instructions for paying outside the site (InstaPay, wallet, bank) and sending proof on WhatsApp with the reference. */
export function ManualPaymentBlock({payment, locale, labels, whatsappNumber, now}: {
  payment: ManualPayment;
  locale: FormatLocale;
  labels: ManualPaymentLabels;
  whatsappNumber?: string;
  now: Date;
}) {
  const left = hoursLeft(payment.expiresAt, now);
  const digits = (whatsappNumber ?? '').replace(/\D/gu, '');
  const whatsappText = labels.whatsapp.replace('{reference}', payment.reference);
  return (
    <section className="manual-pay" aria-labelledby="manual-pay-title">
      <h2 id="manual-pay-title">{labels.title}</h2>
      <div className="reference-box">
        <span>{labels.reference}</span>
        <strong data-testid="manual-reference"><Bidi>{payment.reference}</Bidi></strong>
        <CopyButton value={payment.reference} label={labels.copy} copiedLabel={labels.copied} />
      </div>
      <div className="manual-pay-row"><span>{labels.amount}</span><strong><Bidi>{formatMoney(payment.amountMinor / 100, locale)}</Bidi></strong></div>
      <div className="manual-pay-methods">
        <h3>{labels.methods}</h3>
        {payment.methods.length === 0
          ? <p>{labels.noMethods}</p>
          : <ul>{payment.methods.map((method) => (
            <li key={method.id}><strong>{method.label[locale]}</strong><p>{method.details[locale]}</p></li>
          ))}</ul>}
      </div>
      <p className="manual-pay-deadline">
        {left > 0
          ? `${labels.deadline.replace('{date}', formatDate(payment.expiresAt, locale))} · ${labels.hoursLeft.replace('{hours}', String(left))}`
          : labels.expired}
      </p>
      <p className="pending-instructions">{labels.instructions.replace('{reference}', payment.reference)}</p>
      {digits ? <a className="button whatsapp-button" href={`https://wa.me/${digits}?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer">{whatsappText}</a> : null}
    </section>
  );
}
