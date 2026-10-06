import {getTranslations} from 'next-intl/server';
import {WordMark} from './LpHeader';

export async function LpFooter() {
  const t = await getTranslations('lp');
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer__row">
        <div><WordMark brand={t('brand')} /><p>{t('footer.note')}</p></div>
        <nav aria-label={t('brand')}>
          {(['terms', 'privacy', 'refund'] as const).map((item) => <a href="#legal" key={item}>{t(`footer.${item}`)}</a>)}
        </nav>
      </div>
      <p className="lp-wrap lp-footer__legal" id="legal">{t('footer.legal')}</p>
    </footer>
  );
}
