'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';
import {CopyButton} from '@/commerce/CopyButton';
import {issueEditLinkAction} from './actions';

/** Issues a private edit link. The secret is shown here once and cannot be shown again. */
export function EditLinkIssuer({invitationId}: {invitationId: string}) {
  const t = useTranslations('adminMore.editLinks');
  const tErr = useTranslations('adminMore');
  const locale = useLocale();
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function issue() {
    setError(null);
    start(async () => {
      const result = await issueEditLinkAction(invitationId, label);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const path = (result.data as {path: string}).path;
      setUrl(`${window.location.origin}/${locale}${path}`);
      setLabel('');
      router.refresh();
    });
  }

  return (
    <div className="am-form">
      <label>{t('label')}<input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} data-testid="link-label" /></label>
      <div className="am-form__row">
        <button type="button" className="dashboard-btn-primary" disabled={pending} onClick={issue} data-testid="issue-link">{t('issue')}</button>
        {error && <span className="am-error" role="alert" data-code={error}>{tErr.has(`errors.${error}`) ? tErr(`errors.${error}`) : tErr('errors.unknown_error')}</span>}
      </div>
      {url !== null && (
        <div className="am-card" data-testid="new-link">
          <p className="am-error">{t('showOnce')}</p>
          <p className="am-mono" dir="ltr" data-testid="new-link-url">{url}</p>
          <CopyButton value={url} label={t('copy')} copiedLabel={t('copied')} className="dashboard-btn-secondary" />
        </div>
      )}
    </div>
  );
}
