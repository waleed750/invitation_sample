import {getTranslations} from 'next-intl/server';
import {StarMark} from './StarMark';
import '../../styles/home-how.css';

export const STEP_KEYS = ['s1', 's2', 's3'] as const;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export async function HowItWorks({editsAllowed}: {editsAllowed: number}) {
  const t = await getTranslations('home');
  return (
    <section id="how" className="hm-section" aria-labelledby="hm-how-title">
      <div className="hm-wrap">
        <div className="hm-head">
          <p className="hm-eyebrow">{t('how.eyebrow')}</p>
          <h2 id="hm-how-title" className="hm-h2">{t('how.title')}</h2>
        </div>
        <ol className="hm-how__grid">
          {STEP_KEYS.map((key, index) => (
            <li className={`hm-how__step ${index === 0 ? 'hm-how__step--lead' : ''}`} key={key}>
              <p className="hm-how__numrow">
                <span className="hm-how__num" aria-hidden="true">{pad2(index + 1)}</span>
                <StarMark size={22} ring={false} />
              </p>
              <h3 className="hm-how__title">{t(`how.${key}.title`)}</h3>
              <p className="hm-how__body">{t(`how.${key}.body`)}</p>
              {key === 's3' ? (
                <div className="hm-how__gl" role="region" aria-label={t('how.guestList.example')}>
                  <div className="hm-how__gl-head">
                    <span className="hm-how__gl-tag">{t('how.guestList.example')}</span>
                    <span className="hm-how__gl-total">{t('how.guestList.total')}</span>
                  </div>
                  <ul className="hm-how__gl-rows">
                    <li className="hm-how__gl-row">
                      <span className="hm-how__gl-name">{t('how.guestList.guest1')}</span>
                      <span className="hm-how__gl-chip hm-how__gl-chip--ok">{t('how.guestList.attending')}</span>
                    </li>
                    <li className="hm-how__gl-row">
                      <span className="hm-how__gl-name">{t('how.guestList.guest2')}</span>
                      <span className="hm-how__gl-chip hm-how__gl-chip--ok">{t('how.guestList.attending')}</span>
                    </li>
                    <li className="hm-how__gl-row">
                      <span className="hm-how__gl-name">{t('how.guestList.guest3')}</span>
                      <span className="hm-how__gl-chip hm-how__gl-chip--no">{t('how.guestList.declined')}</span>
                    </li>
                  </ul>
                  <div className="hm-how__gl-foot">
                    <span>{t('how.guestList.total')}</span>
                  </div>
                </div>
              ) : null}
              <p className="hm-how__tag">{key === 's2' ? t('how.s2.tag', {n: editsAllowed}) : t(`how.${key}.tag`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
