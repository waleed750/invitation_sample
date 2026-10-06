import {getTranslations} from 'next-intl/server';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {Link} from '@/i18n/navigation';

export function WordMark({brand}: {brand: string}) {
  return (
    <span className="lp-wordmark">
      <svg viewBox="0 0 24 28" width="22" height="26" aria-hidden="true"><path d="M3 27V12a9 9 0 0 1 18 0v15z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="12" cy="14" r="2.6" fill="currentColor" /></svg>
      <span>{brand}</span>
    </span>
  );
}

export async function LpHeader({featuredSlug}: {featuredSlug: string}) {
  const t = await getTranslations('lp');
  return (
    <header className="lp-header">
      <Link href="/" className="lp-header__brand" aria-label={t('brand')}><WordMark brand={t('brand')} /></Link>
      <nav className="lp-header__nav" aria-label={t('nav.label')}>
        <Link href="/templates">{t('nav.designs')}</Link>
        <a href="#pricing">{t('nav.pricing')}</a>
        <a href="#journey">{t('nav.how')}</a>
      </nav>
      <div className="lp-header__end">
        <LanguageSwitcher />
        <Link className="lp-btn lp-btn--red" href={`/checkout/${featuredSlug}`}>{t('nav.start')}</Link>
      </div>
    </header>
  );
}
