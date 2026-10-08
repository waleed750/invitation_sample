import '@/styles/dashboard.css';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SignOutButton} from '@/auth/SignOutButton';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {homeFontClassName} from '@/components/home/fonts';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {requireAdmin} from '@/admin/guard';

export const dynamic = 'force-dynamic';

function AdminNav() {
  return (
    <nav className="dashboard-nav-list">
      <Link href="/admin/payments" className="dashboard-nav-item">Payments</Link>
      <Link href="/admin/customers" className="dashboard-nav-item">Customers</Link>
    </nav>
  );
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireAdmin(locale);
  
  return (
    <div className={`dashboard-root ${homeFontClassName}`}>
      <header className="dashboard-header">
        <div className="dashboard-header-wrap">
          <Link className="dashboard-brand-link" href="/admin">
            <span className="dashboard-brand-name">Admin Control</span>
          </Link>
          <div className="dashboard-header-actions">
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <AdminNav />
        </aside>
        <main className="dashboard-main" id="dashboard-content">
          {children}
        </main>
        <div className="dashboard-bottom">
          <AdminNav />
        </div>
      </div>
    </div>
  );
}
