'use client';

import {useTransition} from 'react';
import {useTranslations} from 'next-intl';
import {authClient} from './client';

export function SignOutButton() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      window.location.reload();
    });
  }

  return (
    <button className="header-signout-btn" type="button" disabled={pending} onClick={handleSignOut}>
      {t('signOut')}
    </button>
  );
}
