import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {StarMark} from './StarMark';

export async function SiteFooter() {
  const t = await getTranslations('home');
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/gu, '');
  return (
    <footer className="hm-footer">
      <div className="hm-wrap">
        <div className="hm-footer__grid">
          <div className="hm-footer__about">
            <Link href="/" className="hm-brand"><span className="hm-brand__mark"><StarMark size={32} /></span><span className="hm-brand__name">{t('brand')}</span></Link>
            <p>{t('footer.about')}</p>
          </div>
          <nav aria-label={t('footer.c1')}>
            <h3>{t('footer.c1')}</h3>
            <Link href="/templates">{t('footer.gallery')}</Link>
            <Link href="/#pricing">{t('footer.pricing')}</Link>
            <Link href="/#how">{t('footer.how')}</Link>
          </nav>
          <nav aria-label={t('footer.c2')}>
            <h3>{t('footer.c2')}</h3>
            <a href="#legal">{t('footer.terms')}</a>
            <a href="#legal">{t('footer.privacy')}</a>
            <Link href="/#faq">{t('footer.faq')}</Link>
          </nav>
          <nav aria-label={t('footer.c3')}>
            <h3>{t('footer.c3')}</h3>
            {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">{t('footer.whatsapp')}</a> : null}
            <Link href="/app">{t('nav.account')}</Link>
          </nav>
        </div>
        <div className="hm-footer__bottom"><p>{t('footer.rights', {brand: t('brand')})}</p><p>{t('footer.made')}</p></div>
        <p className="hm-footer__legal" id="legal">{t('footer.legal')}</p>
      </div>
    </footer>
  );
}
