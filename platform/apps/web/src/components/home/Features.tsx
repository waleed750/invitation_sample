import {getTranslations} from 'next-intl/server';
import {StarMark} from './StarMark';
import '../../styles/home-features.css';

const FEATURE_KEYS = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'] as const;

export async function Features() {
  const t = await getTranslations('home');
  return (
    <section className="hm-section" aria-labelledby="hm-features-title">
      <div className="hm-wrap">
        <div className="hm-head">
          <p className="hm-eyebrow">{t('features.eyebrow')}</p>
          <h2 id="hm-features-title" className="hm-h2">{t('features.title')}</h2>
        </div>
        <ul className="hm-features__list">
          {FEATURE_KEYS.map((key) => (
            <li className="hm-features__row" key={key}>
              <h3 className="hm-features__title"><StarMark size={18} ring={false} />{t(`features.${key}.title`)}</h3>
              <p className="hm-features__body">{t(`features.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
