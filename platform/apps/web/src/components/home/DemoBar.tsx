'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import '../../styles/demo-bar.css';

type Props = {slug: string; tier: string; price: string};

// Floating "buy this design" bar on public demo pages. It steps aside while the guest form is on screen.
export function DemoBar({slug, tier, price}: Props) {
  const t = useTranslations('demoBar');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById('rsvp-title')?.closest('section') ?? document.querySelector('footer');
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), {threshold: 0.15});
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <aside className={`demo-bar${hidden ? ' is-hidden' : ''}`} aria-label={t('label')}>
      <Link className="demo-bar__back" href="/templates">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="demo-bar__arrow"><path d="M15 6l-6 6 6 6" /></svg>
        {t('back')}
      </Link>
      <span className="demo-bar__price">{t('from')} {price}</span>
      <Link className="demo-bar__cta" href={`/checkout/${slug}?tier=${tier}`}>{t('use')}</Link>
    </aside>
  );
}
