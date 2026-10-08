import {getTranslations} from 'next-intl/server';
import {IconStar} from './icons';

export async function DemoBanner() {
  const t = await getTranslations('demoMode');
  return (
    <div className="demo-banner" role="status">
      <IconStar size={16} className="demo-banner__star" />
      <span>{t('banner')}</span>
    </div>
  );
}
