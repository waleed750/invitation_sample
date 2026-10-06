import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {StarMark} from './StarMark';

export async function Early({featuredSlug}: {featuredSlug: string}) {
  const t = await getTranslations('home.early');
  return (
    <section className="hm-section hm-early" aria-labelledby="hm-early-title">
      <div className="hm-wrap">
        <div className="hm-early__box">
          <StarMark size={36} />
          <p className="hm-eyebrow">{t('eyebrow')}</p>
          <h2 id="hm-early-title" className="hm-h2">{t('title')}</h2>
          <p>{t('body')}</p>
          <Link className="hm-btn hm-btn--primary hm-btn--big" href={`/checkout/${featuredSlug}`}>{t('cta')}</Link>
        </div>
      </div>
    </section>
  );
}
