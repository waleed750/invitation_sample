'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {Bidi} from '@/components/Bidi';
import {CopyButton} from '@/commerce/CopyButton';
import {formatDate, formatMoney} from '@/lib/format';
import {BalanceClientError, createTopup, fetchBalance} from './client';
import {minorToEgp, parseEgpToMinor} from './money';
import type {Balance, LedgerItem, Topup, TopupWithInstructions} from './types';

interface Props {
  initial: Balance;
  ledger: LedgerItem[];
  topups: Topup[];
  /** Pre-filled amount (EGP) from the "Top up and pay" link. */
  suggestedMinor?: number;
}

const POLL_MS = 5000;

export function BalanceView({initial, ledger, topups, suggestedMinor}: Props) {
  const t = useTranslations('balance');
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const [balance, setBalance] = useState(initial);
  const [amount, setAmount] = useState(() => {
    const start = Math.max(suggestedMinor ?? 0, initial.minTopupMinor);
    return String(Math.ceil(minorToEgp(start)));
  });
  const [created, setCreated] = useState<TopupWithInstructions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState(false);
  const baseline = useRef({balance: initial.balanceMinor, awaiting: initial.awaitingOrders.length});

  const pendingTopup = created ?? topups.find((topup) => topup.status === 'pending') ?? null;
  const waiting = pendingTopup !== null && received === false;

  // While a top-up is pending, check every few seconds and turn green the moment it is confirmed.
  const poll = useCallback(async () => {
    try {
      const next = await fetchBalance();
      setBalance(next);
      if (next.balanceMinor !== baseline.current.balance || next.awaitingOrders.length !== baseline.current.awaiting) {
        baseline.current = {balance: next.balanceMinor, awaiting: next.awaitingOrders.length};
        setReceived(true);
        router.refresh();
      }
    } catch {
      // a failed poll is retried on the next tick
    }
  }, [router]);

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => window.clearInterval(id);
  }, [waiting, poll]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const minor = parseEgpToMinor(amount);
    if (minor === null) return setError(t('errors.invalidAmount'));
    if (minor < balance.minTopupMinor) return setError(t('errors.belowMinimum', {min: formatMoney(minorToEgp(balance.minTopupMinor), locale)}));
    if (minor > balance.maxTopupMinor) return setError(t('errors.aboveMaximum', {max: formatMoney(minorToEgp(balance.maxTopupMinor), locale)}));
    setBusy(true);
    try {
      const topup = await createTopup(minor);
      baseline.current = {balance: balance.balanceMinor, awaiting: balance.awaitingOrders.length};
      setReceived(false);
      setCreated(topup);
      router.refresh();
    } catch (failure) {
      const code = failure instanceof BalanceClientError ? failure.code : 'generic';
      setError(t.has(`errors.${code}`) ? t(`errors.${code}`, {min: formatMoney(minorToEgp(balance.minTopupMinor), locale)}) : t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  const presets = [balance.minTopupMinor, 50000, 100000, 200000].filter((value, index, all) => value >= balance.minTopupMinor && all.indexOf(value) === index);

  return (
    <div className="balance-page">
      <header className="balance-hero">
        <p className="balance-hero__label">{t('current')}</p>
        <p className="balance-hero__amount" data-testid="balance-amount"><Bidi>{formatMoney(minorToEgp(balance.balanceMinor), locale)}</Bidi></p>
        <p className="balance-hero__note">{t('storeCredit')}</p>
      </header>

      {received && (
        <p className="balance-success" role="status" data-testid="balance-received">{t('received')}</p>
      )}

      {balance.awaitingOrders.length > 0 && (
        <section className="balance-card" aria-labelledby="awaiting-title">
          <h2 id="awaiting-title">{t('awaitingTitle')}</h2>
          <p>{t('awaitingLead', {shortfall: formatMoney(minorToEgp(balance.shortfallMinor), locale)})}</p>
          <ul className="balance-list">
            {balance.awaitingOrders.map((order) => (
              <li key={order.id}><span>{order.templateSlug ?? t('order')}</span><Bidi>{formatMoney(minorToEgp(order.amountMinor), locale)}</Bidi></li>
            ))}
          </ul>
        </section>
      )}

      {pendingTopup ? (
        <section className="balance-card balance-topup" aria-labelledby="topup-title" data-testid="topup-card">
          <h2 id="topup-title">{waiting ? t('waitingTitle') : t('topupTitle')}</h2>
          <p>{t('transferExactly')}</p>
          <dl className="balance-facts">
            <div><dt>{t('amountToSend')}</dt><dd><Bidi>{formatMoney(minorToEgp(pendingTopup.expectedMinor), locale)}</Bidi><CopyButton value={(pendingTopup.expectedMinor / 100).toFixed(2)} label={t('copy')} copiedLabel={t('copied')} className="btn-ghost-mini" /></dd></div>
            <div><dt>{t('reference')}</dt><dd><span data-testid="topup-reference"><Bidi>{pendingTopup.reference}</Bidi></span><CopyButton value={pendingTopup.reference} label={t('copy')} copiedLabel={t('copied')} className="btn-ghost-mini" /></dd></div>
            <div><dt>{t('expires')}</dt><dd>{formatDate(pendingTopup.expiresAt, locale)}</dd></div>
          </dl>
          {created?.instructions?.methods?.map((method) => (
            <div key={method.id} className="balance-method">
              <strong>{method.label[locale]}</strong>
              <p>{method.details[locale]}</p>
            </div>
          ))}
          <p className="balance-hint">{t('afterTransfer')}</p>
          {waiting && <p className="balance-waiting" role="status">{t('checking')}</p>}
        </section>
      ) : (
        <form className="balance-card" onSubmit={(event) => void submit(event)} noValidate>
          <h2>{t('topupTitle')}</h2>
          <p>{t('minNote', {min: formatMoney(minorToEgp(balance.minTopupMinor), locale)})}{balance.bonusPercent > 0 ? ` ${t('bonusNote', {percent: balance.bonusPercent})}` : ''}</p>
          <div className="balance-presets">
            {presets.map((value) => (
              <button key={value} type="button" className="balance-chip" onClick={() => setAmount(String(minorToEgp(value)))}>
                <Bidi>{formatMoney(minorToEgp(value), locale)}</Bidi>
              </button>
            ))}
          </div>
          <label className="balance-field">
            <span>{t('amountLabel')}</span>
            <input name="amount" dir="ltr" inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={error !== null} />
          </label>
          {error && <p className="balance-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>{busy ? t('creating') : t('createTopup')}</button>
        </form>
      )}

      <section className="balance-card" aria-labelledby="history-title">
        <h2 id="history-title">{t('historyTitle')}</h2>
        {ledger.length === 0 ? <p className="balance-note">{t('historyEmpty')}</p> : (
          <ul className="balance-ledger">
            {ledger.map((item) => (
              <li key={item.id} className={item.amountMinor < 0 ? 'is-out' : 'is-in'}>
                <div>
                  <strong>{t(`kinds.${item.kind}`)}</strong>
                  <span>{formatDate(item.createdAt, locale)}</span>
                </div>
                <Bidi>{`${item.amountMinor < 0 ? '−' : '+'}${formatMoney(minorToEgp(Math.abs(item.amountMinor)), locale)}`}</Bidi>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
