'use client';

import {useState, useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Bidi} from '@/components/Bidi';
import {formatMoney} from '@/lib/format';
import {buyUpgradeAction} from './actions';

interface Props {
  invitationId: string;
  extensionPriceEgp: number;
  editsPriceEgp: number;
  editsPerPack: number;
}

/** The two packs a customer can add to an invitation. Buying opens the usual pay page (balance or top-up). */
export function UpgradeOffers({invitationId, extensionPriceEgp, editsPriceEgp, editsPerPack}: Props) {
  const t = useTranslations('customer.upgrades');
  const locale = useLocale() as 'ar' | 'en';
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<'extension' | 'edits' | null>(null);

  function buy(kind: 'extension' | 'edits') {
    setError(null);
    setBusy(kind);
    start(async () => {
      const result = await buyUpgradeAction({locale, invitationId, kind});
      // A successful purchase redirects; only a failure comes back here.
      setError(result.error);
      setBusy(null);
    });
  }

  return (
    <div className="upgrade-grid">
      <section className="upgrade-card" data-testid="offer-extension">
        <h3>{t('extension.title')}</h3>
        <p>{t('extension.body')}</p>
        <p className="upgrade-price"><Bidi>{formatMoney(extensionPriceEgp, locale)}</Bidi></p>
        <button type="button" className="btn-primary" disabled={pending} onClick={() => buy('extension')} data-testid="buy-extension">
          {busy === 'extension' ? t('buying') : t('buy')}
        </button>
      </section>
      <section className="upgrade-card" data-testid="offer-edits">
        <h3>{t('edits.title', {count: editsPerPack})}</h3>
        <p>{t('edits.body', {count: editsPerPack})}</p>
        <p className="upgrade-price"><Bidi>{formatMoney(editsPriceEgp, locale)}</Bidi></p>
        <button type="button" className="btn-primary" disabled={pending} onClick={() => buy('edits')} data-testid="buy-edits">
          {busy === 'edits' ? t('buying') : t('buy')}
        </button>
      </section>
      {error && <p className="customer-error" role="alert" data-testid="upgrade-error">{t(`errors.${error === 'not_found' ? 'not_found' : 'failed'}`)}</p>}
    </div>
  );
}
