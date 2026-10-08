'use client';

import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {IconAccount, IconHome, IconOrders, IconUsers} from './icons';

interface DashboardNavProps {
  firstInvitationId?: string;
}

export function DashboardNav({firstInvitationId}: DashboardNavProps) {
  const pathname = usePathname();
  const t = useTranslations('dashboard.nav');

  const items = [
    {
      href: '/app',
      key: 'home' as const,
      icon: <IconHome size={22} />,
      isActive: pathname === '/app',
    },
    {
      href: firstInvitationId ? `/app/invitations/${firstInvitationId}/guests` : '/app',
      key: 'guests' as const,
      icon: <IconUsers size={22} />,
      isActive: pathname.includes('/guests'),
    },
    {
      href: '/app/orders',
      key: 'orders' as const,
      icon: <IconOrders size={22} />,
      isActive: pathname.startsWith('/app/orders'),
    },
    {
      href: '/app/account',
      key: 'account' as const,
      icon: <IconAccount size={22} />,
      isActive: pathname.startsWith('/app/account'),
    },
  ];

  return (
    <nav className="dashboard-nav" aria-label={t('label')}>
      {items.map((item) => (
        <Link
          href={item.href}
          key={item.key}
          className={`nav-tab-item ${item.isActive ? 'is-active' : ''}`}
          aria-current={item.isActive ? 'page' : undefined}
        >
          <span className="nav-tab-icon">{item.icon}</span>
          <span className="nav-tab-label">{t(item.key)}</span>
        </Link>
      ))}
    </nav>
  );
}
