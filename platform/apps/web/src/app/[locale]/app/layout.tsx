import '@/styles/dashboard.css';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {DashboardNav} from '@/commerce/DashboardNav';
import {DashboardSignIn} from '@/commerce/DashboardSignIn';
import {DemoBanner} from '@/commerce/DemoBanner';
import {signOutAction} from '@/commerce/dashboard-actions';
import {getCommerceClient} from '@/commerce';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';

// Per-user, cookie-backed pages must never be prerendered.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const session = await getCommerceClient().getSession();
  const t = await getTranslations('dashboard');
  return <div className="dashboard-root"><DemoBanner /><header className="dashboard-header"><Link className="brand" href="/">{t('brand')}</Link><div className="dashboard-header-actions"><LanguageSwitcher />{session && <form action={signOutAction}><input type="hidden" name="locale" value={locale} /><button className="header-signout" type="submit">{t('account.signOut')}</button></form>}</div></header>{session ? <div className="dashboard-shell"><aside className="dashboard-sidebar"><DashboardNav /></aside><main className="dashboard-main" id="dashboard-content">{children}</main><div className="dashboard-bottom"><DashboardNav /></div></div> : <DashboardSignIn locale={locale} />}</div>;
}
