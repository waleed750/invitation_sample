'use client';

import {useTranslations} from 'next-intl';
import {revokeEditLinkAction} from './actions';
import {ActionButton} from './ActionForm';

export function RevokeLinkButton({linkId}: {linkId: string}) {
  const t = useTranslations('adminMore.editLinks');
  return <ActionButton run={() => revokeEditLinkAction(linkId)} label={t('revoke')} confirmText={t('confirmRevoke')} testId="revoke-link" />;
}
