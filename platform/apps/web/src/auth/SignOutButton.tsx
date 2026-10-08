'use client';

import {useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {signOutAuthAction} from './actions';

export function SignOutButton() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  return (
    <button className="header-signout-btn" type="button" disabled={pending} onClick={() => startTransition(() => void signOutAuthAction(locale))}>
      {t('signOut')}
    </button>
  );
}
