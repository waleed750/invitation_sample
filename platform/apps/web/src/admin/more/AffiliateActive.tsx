'use client';

import {useTranslations} from 'next-intl';
import {setAffiliateActiveAction} from './actions';
import {ActionButton} from './ActionForm';

export function AffiliateActive({id, name, active}: {id: string; name: string; active: boolean}) {
  const t = useTranslations('adminMore.affiliates');
  return <ActionButton run={() => setAffiliateActiveAction(id, name, !active)} label={active ? t('deactivate') : t('activate')} testId="affiliate-toggle" />;
}
