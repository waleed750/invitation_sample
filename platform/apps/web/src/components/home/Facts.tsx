import {getTranslations} from 'next-intl/server';
import {StarMark} from './StarMark';

export async function Facts() {
  const t = await getTranslations('home.facts');
  return (
    <section className="hm-facts" aria-label={t('label')}>
      <div className="hm-wrap">
        <ul>
          {(['once', 'noapp', 'bilingual', 'refund'] as const).map((key) => <li key={key}><StarMark size={20} />{t(key)}</li>)}
        </ul>
      </div>
    </section>
  );
}
