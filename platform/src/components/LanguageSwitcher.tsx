 'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const pathname = usePathname();
  const router = useRouter();
  function switchLocale(nextLocale: Locale) {
    document.cookie = `NEXT_LOCALE=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, {locale: nextLocale, scroll: false});
  }
  return (
    <nav className="language-switcher" aria-label={t('label')}>
      {routing.locales.map((value) => (
        <button key={value} type="button" lang={value} dir={value === 'ar' ? 'rtl' : 'ltr'}
          aria-pressed={locale === value} onClick={() => switchLocale(value)}>
          {t(value)}
        </button>
      ))}
    </nav>
  );
}
