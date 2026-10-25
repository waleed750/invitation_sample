'use client';

import {useTranslations} from 'next-intl';
import {setCouponActiveAction} from './actions';
import {ActionButton} from './ActionForm';

export function CouponToggle({code, active}: {code: string; active: boolean}) {
  const t = useTranslations('adminMore.coupons');
  return <ActionButton run={() => setCouponActiveAction(code, !active)} label={active ? t('deactivate') : t('activate')} testId={`toggle-${code}`} />;
}
