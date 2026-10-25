'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Bidi} from '@/components/Bidi';
import {publishInvitation} from './api';

interface Props {
  invitationId: string;
  remaining: number;
  expired: boolean;
  published: boolean;
  slug: string;
  /** Resolves true once the server holds the current draft. */
  saveNow: () => Promise<boolean>;
  blocked: boolean;
  onPublished: (editsLeft: number) => void;
}

/** Publish with the remaining-edits counter, and the "no edits left" / "expired" states with their way forward. */
export function PublishBar({invitationId, remaining, expired, published, slug, saveNow, blocked, onPublished}: Props) {
  const t = useTranslations('editor.publish');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{slug: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      if (!(await saveNow())) {
        setError('saveFirst');
        return;
      }
      const outcome = await publishInvitation(invitationId);
      if (outcome.ok) {
        setDone({slug: outcome.slug});
        onPublished(outcome.editsLeft);
      } else setError(outcome.reason === 'expired' ? 'expired' : outcome.reason === 'no_edits_left' ? 'noEdits' : 'generic');
    } catch {
      setError('generic');
    } finally {
      setBusy(false);
    }
  }

  if (expired) {
    return (
      <div className="ed-publish is-blocked" data-testid="publish-expired">
        <p>{t('expired')}</p>
        <Link className="ed-btn ed-btn--primary" href={`/app/upgrades?invitation=${invitationId}`}>{t('extend')}</Link>
      </div>
    );
  }
  if (remaining <= 0) {
    return (
      <div className="ed-publish is-blocked" data-testid="publish-no-edits">
        <p>{t('noEdits')}</p>
        <Link className="ed-btn ed-btn--primary" href={`/app/upgrades?invitation=${invitationId}`}>{t('buyEdits')}</Link>
      </div>
    );
  }
  return (
    <div className="ed-publish">
      <button type="button" className="ed-btn ed-btn--primary" data-testid="publish" disabled={busy || blocked} onClick={() => void publish()}>
        {busy ? t('publishing') : published ? t('update') : t('publish')}
      </button>
      <span className="ed-counter" data-testid="edits-left">{t('editsLeft', {count: remaining})}</span>
      {error && <p className="ed-error" role="alert">{t(`errors.${error}`)}</p>}
      {done && (
        <p className="ed-success" role="status" data-testid="publish-done">
          {t('done')} <Link href={`/i/${done.slug}`} target="_blank"><Bidi>{`/i/${done.slug}`}</Bidi></Link>
        </p>
      )}
      {!done && published && <Link className="ed-link" href={`/i/${slug}`} target="_blank">{t('view')}</Link>}
    </div>
  );
}
