import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export async function FinalBand({featuredSlug}: {featuredSlug: string}) {
  const t = await getTranslations('lp.final');
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/gu, '');
  return (
    <section className="lp-final" aria-labelledby="lp-final-title">
      <div className="lp-wrap">
        <h2 id="lp-final-title" className="lp-final__title">{t('title')}</h2>
        <div className="lp-final__actions">
          <Link className="lp-btn lp-btn--paper" href={`/checkout/${featuredSlug}`}>{t('start')}</Link>
          {whatsapp ? <a className="lp-btn lp-btn--line" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">{t('whatsapp')}</a> : null}
        </div>
        <p className="lp-final__proof">{t('proof')}</p>
      </div>
    </section>
  );
}
