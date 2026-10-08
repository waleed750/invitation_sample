import type {Metadata} from 'next';
import localFont from 'next/font/local';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import '@/styles/globals.css';

const cairo = localFont({
  src: [
    { path: '../../fonts/cairo/cairo-latin.woff2', weight: '200 1000', style: 'normal' },
    { path: '../../fonts/cairo/cairo-arabic.woff2', weight: '200 1000', style: 'normal' }
  ],
  variable: '--font-cairo',
  display: 'swap',
  adjustFontFallback: false
});

const display = localFont({
  src: [
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' }
  ],
  variable: '--font-cormorant',
  display: 'swap',
  adjustFontFallback: false
});

const inter = localFont({
  src: [
    { path: '../../fonts/inter/inter-latin.woff2', weight: '200 1000', style: 'normal' }
  ],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: false
});

type Props = {children: React.ReactNode; params: Promise<{locale: string}>};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Omit<Props, 'children'>): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({locale, namespace: 'metadata'});
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: t('title'), description: t('description'),
    alternates: {canonical: `/${locale}`, languages: {ar: '/ar', en: '/en', 'x-default': '/ar'}}
  };
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={`${cairo.variable} ${display.variable} ${inter.variable}`}>
      <body><NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider></body>
    </html>
  );
}
