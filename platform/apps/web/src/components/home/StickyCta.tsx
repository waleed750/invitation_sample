'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {formatMoney, type FormatLocale} from '@/lib/format';

export function StickyCta({featuredSlug}: {featuredSlug: string}) {
  const t = useTranslations('home');
  const locale = useLocale() as FormatLocale;
  const [heroOut, setHeroOut] = useState(false);
  const [footerIn, setFooterIn] = useState(false);

  useEffect(() => {
    const heroEl = document.getElementById('hero') || document.querySelector('.hm-hero');
    const footerEl = document.querySelector('footer') || document.querySelector('.hm-footer');

    if (!heroEl || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const heroObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setHeroOut(!entry?.isIntersecting);
      },
      {threshold: 0}
    );
    heroObserver.observe(heroEl);

    let footerObserver: IntersectionObserver | null = null;
    if (footerEl) {
      footerObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setFooterIn(Boolean(entry?.isIntersecting));
        },
        {threshold: 0}
      );
      footerObserver.observe(footerEl);
    }

    return () => {
      heroObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, []);

  const isVisible = heroOut && !footerIn;

  return (
    <div
      className={`hm-sticky ${isVisible ? 'is-visible' : ''}`}
      aria-hidden={!isVisible}
    >
      <div className="hm-sticky__inner">
        <div className="hm-sticky__price">
          <span className="hm-sticky__price-label">{t('templates.from')}</span>
          <strong className="hm-sticky__price-val">{formatMoney(499, locale)}</strong>
        </div>
        <Link
          className="hm-btn hm-btn--primary hm-sticky__btn"
          href={`/checkout/${featuredSlug}`}
          tabIndex={isVisible ? 0 : -1}
        >
          {t('nav.cta')}
        </Link>
      </div>
    </div>
  );
}
