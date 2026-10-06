import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export async function StickyCta({featuredSlug}: {featuredSlug: string}) {
  const t = await getTranslations('home.nav');
  return <div className="hm-sticky"><Link className="hm-btn hm-btn--primary hm-btn--big" href={`/checkout/${featuredSlug}`}>{t('cta')}</Link></div>;
}
