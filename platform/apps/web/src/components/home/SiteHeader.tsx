import {getTranslations} from 'next-intl/server';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {Link} from '@/i18n/navigation';
import {StarMark} from './StarMark';

export async function SiteHeader({featuredSlug}: {featuredSlug: string}) {
  const t = await getTranslations('home');
  const links = [
    {href: '/', label: t('nav.home')},
    {href: '/templates', label: t('nav.templates')},
    {href: '/#pricing', label: t('nav.pricing')},
    {href: '/#how', label: t('nav.how')}
  ] as const;
  return (
    <header className="hm-header">
      <div className="hm-wrap">
        <div className="hm-header__row">
          <div className="hm-header__start">
            <Link href="/" className="hm-brand" aria-label={t('brand')}>
              <span className="hm-brand__mark"><StarMark size={36} /></span>
              <span className="hm-brand__text"><span className="hm-brand__name">{t('brand')}</span><span className="hm-brand__tag">{t('tagline')}</span></span>
            </Link>
            <nav className="hm-nav" aria-label={t('nav.label')}>
              {links.map((item, index) => <Link key={item.href} href={item.href} aria-current={index === 0 ? 'page' : undefined}>{item.label}</Link>)}
            </nav>
          </div>
          <div className="hm-header__end">
            <LanguageSwitcher />
            <Link className="hm-account" href="/app" aria-label={t('nav.account')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6" /></svg>
            </Link>
            <Link className="hm-btn hm-btn--primary hm-header__cta" href={`/checkout/${featuredSlug}`}>{t('nav.cta')}</Link>
          </div>
        </div>
        <nav className="hm-mnav" aria-label={t('nav.label')}>
          {links.slice(1).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
