import type {Metadata} from 'next';
import {Cairo, Cormorant_Garamond, Inter} from 'next/font/google';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import '@/styles/globals.css';

const cairo = Cairo({subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap'});
const display = Cormorant_Garamond({subsets: ['latin'], weight: ['500', '600'], variable: '--font-cormorant', display: 'swap'});
const inter = Inter({subsets: ['latin'], variable: '--font-inter', display: 'swap'});
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
