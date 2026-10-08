import {getTranslations} from 'next-intl/server';
import {TIERS} from '@platform/shared';
import {StarMark} from './StarMark';

export async function Faq() {
  const t = await getTranslations('home.faq');
  const items = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;
  return (
    <section className="hm-section hm-section--alt hm-faq" id="faq" aria-labelledby="hm-faq-title">
      <div className="hm-wrap">
        <div className="hm-head">
          <p className="hm-eyebrow">{t('eyebrow')}</p>
          <h2 id="hm-faq-title" className="hm-h2">{t('title')}</h2>
        </div>
        <div className="hm-faq__list">
          {items.map((key, index) => (
            <details key={key} open={index === 0}>
              <summary>{t(`${key}.q`)}<StarMark size={22} /></summary>
              <p>{t(`${key}.a`, {n: TIERS.classic.editsAllowed})}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
