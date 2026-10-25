'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Link} from '@/i18n/navigation';
import {BalanceClientError, cancelAwaitingOrder, payWithBalance} from './client';

/** Buttons on an "awaiting balance" order card: top up and pay, or cancel. */
export function AwaitingOrderActions({orderId, amountMinor}: {orderId: string; amountMinor: number}) {
  const t = useTranslations('balance');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tryPay() {
    setBusy(true);
    setError(null);
    try {
      const result = await payWithBalance(orderId);
      if (result.paid) router.refresh();
      else router.push(`/app/balance?need=${String(result.shortfallMinor)}`);
    } catch (failure) {
      setError(failure instanceof BalanceClientError && t.has(`errors.${failure.code}`) ? t(`errors.${failure.code}`) : t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      await cancelAwaitingOrder(orderId);
      router.refresh();
    } catch {
      setError(t('errors.generic'));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="awaiting-actions" data-amount={amountMinor}>
      <button type="button" className="button" disabled={busy} onClick={() => void tryPay()}>{t('topUpAndPay')}</button>
      {confirming ? (
        <>
          <button type="button" className="media-danger" disabled={busy} onClick={() => void cancel()}>{t('cancelYes')}</button>
          <button type="button" className="media-link" onClick={() => setConfirming(false)}>{t('cancelNo')}</button>
        </>
      ) : (
        <button type="button" className="media-link" onClick={() => setConfirming(true)}>{t('cancelOrder')}</button>
      )}
      <Link className="media-link" href="/app/balance">{t('openBalance')}</Link>
      {error && <p className="balance-error" role="alert">{error}</p>}
    </div>
  );
}
