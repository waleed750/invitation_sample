import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {Chevron} from './Chevron';
import {StarMark} from './StarMark';

export async function FinalBanner() {
  const t = await getTranslations('home.final');
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/gu, '');
  return (
    <section className="hm-final" aria-labelledby="hm-final-title">
      <div className="hm-wrap">
        <div className="hm-final__box">
          <StarMark size={44} />
          <h2 id="hm-final-title">{t('title')}</h2>
          <p>{t('sub')}</p>
          <div className="hm-final__actions">
            <Link className="hm-btn hm-btn--gold hm-btn--big" href="/templates">{t('cta')}<Chevron /></Link>
            {whatsapp ? <a className="hm-btn hm-btn--line hm-btn--big" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">{t('whatsapp')}</a> : null}
          </div>
          <ul className="hm-final__checks">{(['c1', 'c2', 'c3'] as const).map((key) => <li key={key}><StarMark size={16} ring={false} />{t(key)}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
