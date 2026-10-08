import '@/styles/dashboard.css';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound, redirect} from 'next/navigation';
import {isApiCommerceMode} from '@/auth/config';
import {SignOutButton} from '@/auth/SignOutButton';
import {getServerSession} from '@/auth/session';
import {DashboardNav} from '@/commerce/DashboardNav';
import {DashboardSignIn} from '@/commerce/DashboardSignIn';
import {DemoBanner} from '@/commerce/DemoBanner';
import {IconStar} from '@/commerce/icons';
import {signOutAction} from '@/commerce/dashboard-actions';
import {getCommerceClient} from '@/commerce';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {homeFontClassName} from '@/components/home/fonts';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';

// Per-user, cookie-backed pages must never be prerendered.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const apiMode = isApiCommerceMode();
  if (apiMode && !(await getServerSession())) {
    redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/app`)}`);
  }

  const client = getCommerceClient();
  const [session, invitations] = await Promise.all([client.getSession(), client.listInvitations()]);
  const firstInvitationId = invitations[0]?.id;
  const t = await getTranslations('dashboard');

  return (
    <div className={`dashboard-root ${homeFontClassName}`}>
      <DemoBanner />
      <header className="dashboard-header">
        <div className="dashboard-header-wrap">
          <Link className="dashboard-brand-link" href="/">
            <span className="dashboard-brand-mark"><IconStar size={28} /></span>
            <span className="dashboard-brand-name">{t('brand')}</span>
          </Link>
          <div className="dashboard-header-actions">
            <LanguageSwitcher />
            {apiMode ? (
              <SignOutButton />
            ) : session && (
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button className="header-signout-btn" type="submit">
                  {t('account.signOut')}
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      {session ? (
        <div className="dashboard-shell">
          <aside className="dashboard-sidebar">
            <DashboardNav firstInvitationId={firstInvitationId} />
          </aside>
          <main className="dashboard-main" id="dashboard-content">
            {children}
          </main>
          <div className="dashboard-bottom">
            <DashboardNav firstInvitationId={firstInvitationId} />
          </div>
        </div>
      ) : (
        <DashboardSignIn locale={locale as 'ar' | 'en'} />
      )}
    </div>
  );
}
