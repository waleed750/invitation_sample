import {getTranslations} from 'next-intl/server';
import {isApiCommerceMode} from '@/auth/config';
import {IconStar} from './icons';

/** Shown only in demo (mock) mode; real accounts never see "no charge" copy. */
export async function DemoBanner() {
  if (isApiCommerceMode()) return null;
  const t = await getTranslations('demoMode');
  return (
    <div className="demo-banner" role="status">
      <IconStar size={16} className="demo-banner__star" />
      <span>{t('banner')}</span>
    </div>
  );
}
