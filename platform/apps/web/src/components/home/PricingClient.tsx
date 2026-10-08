'use client';

import {useState} from 'react';
import {TIER_ORDER, type Tier} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {Link} from '@/i18n/navigation';
import {Chevron} from './Chevron';
import {StarMark} from './StarMark';

export type ComparisonRowData = {
  label: string;
  values: Record<Tier, string | number>;
};

export type PricingClientProps = {
  featuredSlug: string;
  planNames: Record<Tier, string>;
  planDescs: Record<Tier, string>;
  planFeatures: Record<Tier, string[]>;
  pricesFormatted: Record<Tier, string>;
  perText: string;
  badgeText: string;
  chooseText: Record<Tier, string>;
  compareRows: ComparisonRowData[];
  switcherAriaLabel: string;
  compareMobileTitle: string;
};

export function PricingClient({
  featuredSlug,
  planNames,
  planDescs,
  planFeatures,
  pricesFormatted,
  perText,
  badgeText,
  chooseText,
  compareRows,
  switcherAriaLabel,
  compareMobileTitle,
}: PricingClientProps) {
  const [activeTier, setActiveTier] = useState<Tier>('classic');

  return (
    <div className="hm-pricing__client">
      {/* Mobile Plan Switcher (segmented tabs, touch targets >= 44px) */}
      <div className="hm-plan-switcher" role="tablist" aria-label={switcherAriaLabel}>
        {TIER_ORDER.map((tier) => {
          const isFeatured = tier === 'classic';
          const isActive = activeTier === tier;
          return (
            <button
              key={tier}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`hm-plan-tab ${isActive ? 'is-active' : ''} ${isFeatured ? 'is-featured' : ''}`}
              onClick={() => setActiveTier(tier)}
            >
              <span>{planNames[tier]}</span>
              {isFeatured ? <StarMark size={14} ring={false} /> : null}
            </button>
          );
        })}
      </div>

      {/* Plan Cards Grid: on mobile only activeTier is shown, on desktop all 3 are shown */}
      <div className="hm-pricing__grid">
        {TIER_ORDER.map((tier) => {
          const isFeatured = tier === 'classic';
          const isSelectedMobile = activeTier === tier;
          return (
            <article
              className={`hm-plan ${isFeatured ? 'is-featured' : ''} ${isSelectedMobile ? 'is-selected-mobile' : ''}`}
              key={tier}
            >
              {isFeatured ? (
                <span className="hm-plan__seal">
                  <StarMark size={14} ring={false} />
                  {badgeText}
                </span>
              ) : null}
              <div>
                <h3 className="hm-plan__name">{planNames[tier]}</h3>
                <p className="hm-plan__desc">{planDescs[tier]}</p>
                <p className="hm-plan__price">
                  <span className="hm-plan__amount">
                    <Bidi>{pricesFormatted[tier]}</Bidi>
                  </span>
                  <span className="hm-plan__per">{perText}</span>
                </p>
                <ul>
                  {planFeatures[tier].map((line) => (
                    <li key={line}>
                      <StarMark size={16} ring={false} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                className={`hm-btn ${isFeatured ? 'hm-btn--gold' : 'hm-btn--line'}`}
                href={`/checkout/${featuredSlug}?tier=${tier}`}
              >
                {chooseText[tier]}
                <Chevron />
              </Link>
            </article>
          );
        })}
      </div>

      {/* Mobile Always-Open Compact Comparison List (replaces scrolling table on mobile) */}
      <div className="hm-compare__compact" role="region" aria-label={compareMobileTitle}>
        <div className="hm-compare__compact-head">
          {TIER_ORDER.map((tier) => {
            const isFeatured = tier === 'classic';
            const isActive = activeTier === tier;
            return (
              <button
                key={tier}
                type="button"
                className={`hm-compare__compact-col-btn ${isActive ? 'is-active' : ''} ${isFeatured ? 'is-featured' : ''}`}
                onClick={() => setActiveTier(tier)}
              >
                <span>{planNames[tier]}</span>
                {isFeatured ? <span className="hm-compare__star" aria-hidden="true">★</span> : null}
              </button>
            );
          })}
        </div>
        <div className="hm-compare__compact-rows">
          {compareRows.map((row) => (
            <div key={row.label} className="hm-compare__compact-row">
              <span className="hm-compare__compact-label">{row.label}</span>
              <span className="hm-compare__compact-val">
                {row.values[activeTier]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
