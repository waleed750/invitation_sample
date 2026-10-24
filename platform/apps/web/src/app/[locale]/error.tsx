'use client';

import '@/styles/public.css';
import {useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

/** Branded error page. It never shows the error message or stack: only a digest the support team can look up. */
export default function LocaleError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const t = useTranslations('public.error');
  useEffect(() => {
    // Reported by the server-side logger; the browser console only gets the opaque digest.
    if (error.digest) console.error(`render error digest=${error.digest}`);
  }, [error]);
  return (
    <main className="public-status-page" data-testid="error-page">
      <div>
        <p className="eyebrow">500</p>
        <h1>{t('title')}</h1>
        <p>{t('lead')}</p>
        {error.digest && <p className="public-ended__date" dir="ltr">{t('code')}: {error.digest}</p>}
        <p><button type="button" className="button" onClick={reset}>{t('retry')}</button></p>
        <Link href="/">{t('home')}</Link>
      </div>
    </main>
  );
}
