import {getTranslations} from 'next-intl/server';

export async function DemoBanner() {
  const t = await getTranslations('demoMode');
  return <div className="demo-banner" role="status"><span aria-hidden="true">◇</span> {t('banner')}</div>;
}

