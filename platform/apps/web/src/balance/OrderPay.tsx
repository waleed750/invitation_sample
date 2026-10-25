'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Bidi} from '@/components/Bidi';
import {CopyButton} from '@/commerce/CopyButton';
import {formatMoney} from '@/lib/format';
import {BalanceClientError, createTopup, fetchOrderStatus, payWithBalance} from './client';
import {minorToEgp} from './money';
import type {PaymentMethodInstruction, Topup, TopupWithInstructions} from './types';

interface Props {
  orderId: string;
  amountMinor: number;
  balanceMinor: number;
  shortfallMinor: number;
  minTopupMinor: number;
  instructions: {methods?: PaymentMethodInstruction[]} | null;
  /** A pending top-up the customer already made (page reload). */
  existingTopup: Topup | null;
  whatsappNumber: string;
}

type Stage = 'choose' | 'details' | 'waiting' | 'paid';
const POLL_MS = 5000;
export const WHATSAPP_AFTER_MS = 30 * 60 * 1000;

/** Pay one order: tap to pay from the balance, or top up (transfer) and wait for the automatic payment. */
export function OrderPay({orderId, amountMinor, balanceMinor, shortfallMinor, minTopupMinor, instructions, existingTopup, whatsappNumber}: Props) {
  const t = useTranslations('orderPay');
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const covered = balanceMinor >= amountMinor;
  const [stage, setStage] = useState<Stage>(existingTopup ? 'details' : 'choose');
  const [topup, setTopup] = useState<Topup | null>(existingTopup);
  const [methods, setMethods] = useState<PaymentMethodInstruction[]>(instructions?.methods ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingSince, setWaitingSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const navigated = useRef(false);

  const needMinor = Math.max(shortfallMinor, minTopupMinor);

  const fail = useCallback((failure: unknown) => {
    const code = failure instanceof BalanceClientError ? failure.code : 'generic';
    setError(t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.generic'));
  }, [t]);

  async function payNow() {
    setBusy(true);
    setError(null);
    try {
      const result = await payWithBalance(orderId);
      if (result.paid) {
        setStage('paid');
        router.push(`/checkout/result/${orderId}`);
      } else {
        router.refresh();
      }
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  }

  async function startTopup() {
    setBusy(true);
    setError(null);
    try {
      const created: TopupWithInstructions = await createTopup(needMinor);
      setTopup(created);
      if (created.instructions?.methods) setMethods(created.instructions.methods);
      setStage('details');
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  }

  function iHavePaid() {
    setWaitingSince(Date.now());
    setStage('waiting');
  }

  // Waiting screen: ask the light status endpoint every 5 seconds and turn green when the order is paid.
  useEffect(() => {
    if (stage !== 'waiting' && stage !== 'details') return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      void (async () => {
        try {
          const status = await fetchOrderStatus(orderId);
          if (status.paid && !navigated.current) {
            navigated.current = true;
            setStage('paid');
            window.setTimeout(() => router.push(`/checkout/result/${orderId}`), 1800);
          }
        } catch {
          // retried on the next tick
        }
      })();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [stage, orderId, router]);

  const waitedLongEnough = waitingSince !== null && now - waitingSince >= WHATSAPP_AFTER_MS;
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`${topup?.reference ?? orderId} — ${t('whatsappText')}`)}`;

  if (stage === 'paid') {
    return (
      <section className="orderpay-card is-paid" role="status" data-testid="order-paid">
        <h2>{t('paidTitle')}</h2>
        <p>{t('paidLead')}</p>
      </section>
    );
  }

  return (
    <section className="orderpay-card" data-testid="order-pay">
      <p className="orderpay-total"><span>{t('total')}</span><strong><Bidi>{formatMoney(minorToEgp(amountMinor), locale)}</Bidi></strong></p>

      {stage === 'choose' && (
        covered ? (
          <>
            <p>{t('balanceCovers', {balance: formatMoney(minorToEgp(balanceMinor), locale)})}</p>
            <button type="button" className="button" disabled={busy} onClick={() => void payNow()}>{busy ? t('paying') : t('payFromBalance')}</button>
          </>
        ) : (
          <>
            <p>{t('notEnough', {balance: formatMoney(minorToEgp(balanceMinor), locale), shortfall: formatMoney(minorToEgp(needMinor), locale)})}</p>
            <p className="orderpay-note">{t('orderSaved')}</p>
            <button type="button" className="button" disabled={busy} onClick={() => void startTopup()}>{busy ? t('creating') : t('showTransfer', {amount: formatMoney(minorToEgp(needMinor), locale)})}</button>
          </>
        )
      )}

      {(stage === 'details' || stage === 'waiting') && topup && (
        <>
          <h2>{stage === 'waiting' ? t('waitingTitle') : t('transferTitle')}</h2>
          <p>{t('transferExactly')}</p>
          <dl className="balance-facts">
            <div><dt>{t('amountToSend')}</dt><dd><Bidi>{formatMoney(minorToEgp(topup.expectedMinor), locale)}</Bidi><CopyButton value={(topup.expectedMinor / 100).toFixed(2)} label={t('copy')} copiedLabel={t('copied')} className="btn-ghost-mini" /></dd></div>
            <div><dt>{t('reference')}</dt><dd><span data-testid="topup-reference"><Bidi>{topup.reference}</Bidi></span><CopyButton value={topup.reference} label={t('copy')} copiedLabel={t('copied')} className="btn-ghost-mini" /></dd></div>
          </dl>
          {methods.map((method) => (
            <div key={method.id} className="balance-method">
              <strong>{method.label[locale]}</strong>
              <p>{method.details[locale]}</p>
              {method.url && <a className="media-link" href={method.url} target="_blank" rel="noopener noreferrer">{t('openApp', {name: method.label[locale]})}</a>}
            </div>
          ))}
          {stage === 'details' ? (
            <button type="button" className="button" onClick={iHavePaid} data-testid="i-have-paid">{t('iHavePaid')}</button>
          ) : (
            <>
              <p className="balance-waiting" role="status">{t('checking')}</p>
              {waitedLongEnough && (
                <p className="orderpay-whatsapp">{t('stillWaiting')} <a className="media-link" href={whatsappHref} target="_blank" rel="noopener noreferrer">{t('messageUs')}</a></p>
              )}
            </>
          )}
        </>
      )}

      {error && <p className="balance-error" role="alert">{error}</p>}
    </section>
  );
}
