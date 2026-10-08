import '@/styles/dashboard.css';
import '@/styles/auth.css';
import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isAuthConfigured} from '@/auth/config';
import {safeNextPath} from '@/auth/safe-next';
import {SignInForm} from '@/auth/SignInForm';
import {routing} from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = {params: Promise<{locale: string}>; searchParams: Promise<{next?: string | string[]; error?: string | string[]}>};

export async function generateMetadata({params}: Pick<Props, 'params'>): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({locale, namespace: 'auth'});
  return {title: t('title'), robots: {index: false}};
}

export default async function SignInPage({params, searchParams}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = safeNextPath(rawNext, locale);
  const t = await getTranslations('auth');
  return (
    <div className="dashboard-root auth-root">
      <main className="dashboard-signin">
        <section className="signin-card" aria-labelledby="signin-title">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 id="signin-title">{t('title')}</h1>
          <p className="signin-intro">{t('description')}</p>
          {isAuthConfigured() ? (
            <SignInForm next={next} initialError={query.error ? 'callback' : undefined} />
          ) : (
            <p className="auth-notice" role="status">{t('notConfigured')}</p>
          )}
        </section>
      </main>
    </div>
  );
}
