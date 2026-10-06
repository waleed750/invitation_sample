'use client';

import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';

const items = [
  {href: '/app', key: 'home', icon: '⌂'},
  {href: '/app/orders', key: 'orders', icon: '▤'},
  {href: '/app/points', key: 'points', icon: '✦'},
  {href: '/app/account', key: 'account', icon: '○'},
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const t = useTranslations('dashboard.nav');
  return <nav className="dashboard-nav" aria-label={t('label')}>{items.map((item) => {
    const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
    return <Link href={item.href} key={item.key} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}><span aria-hidden="true">{item.icon}</span><strong>{t(item.key)}</strong></Link>;
  })}</nav>;
}
