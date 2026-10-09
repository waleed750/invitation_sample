import type {Tier} from '@platform/shared';
import type {PlanView} from './plans';

export type PlanComparisonLabels = {
  title: string;
  selected: string;
  choose: string;
  tierNames: Record<Tier, string>;
  edits: string;
  online: string;
  rsvp: string;
  rsvpNone: string;
  rsvpUnlimited: string;
  videoIntro: string;
  musicUpload: string;
  guestMessages: string;
  prioritySupport: string;
  yes: string;
  no: string;
};

type Props = {
  plans: PlanView[];
  selected: Tier;
  labels: PlanComparisonLabels;
  /** Pre-formatted price per tier (locale-aware). */
  prices: Record<Tier, string>;
  /** Pre-formatted "N months" per tier. */
  months: Record<Tier, string>;
  /** Link target per tier (locale-prefixed). */
  hrefs: Record<Tier, string>;
};

function rsvpText(plan: PlanView, labels: PlanComparisonLabels): string {
  if (plan.rsvpLimit === null) return labels.rsvpUnlimited;
  if (plan.rsvpLimit === 0) return labels.rsvpNone;
  return String(plan.rsvpLimit);
}

export function PlanComparison({plans, selected, labels, prices, months, hrefs}: Props) {
  return (
    <section className="pick-plans" aria-labelledby="pick-plans-title">
      <h2 id="pick-plans-title" className="pick-section-title">{labels.title}</h2>
      <div className="pick-plans__grid">
        {plans.map((plan) => {
          const isSelected = plan.tier === selected;
          const rows: [string, string][] = [
            [labels.edits, String(plan.editsAllowed)],
            [labels.online, months[plan.tier]],
            [labels.rsvp, rsvpText(plan, labels)],
            [labels.videoIntro, plan.features.videoIntro ? labels.yes : labels.no],
            [labels.musicUpload, plan.features.musicUpload ? labels.yes : labels.no],
            [labels.guestMessages, plan.features.guestMessages ? labels.yes : labels.no],
            [labels.prioritySupport, plan.features.prioritySupport ? labels.yes : labels.no]
          ];
          return (
            <article
              key={plan.tier}
              className={`pick-plan${isSelected ? ' is-selected' : ''}`}
              data-tier={plan.tier}
              aria-current={isSelected ? 'true' : undefined}
            >
              <header className="pick-plan__head">
                <h3>{labels.tierNames[plan.tier]}</h3>
                <p className="pick-plan__price" dir="ltr">{prices[plan.tier]}</p>
              </header>
              <dl className="pick-plan__rows">
                {rows.map(([term, value]) => (
                  <div key={term} className="pick-plan__row">
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {isSelected ? (
                <span className="pick-plan__state">{labels.selected}</span>
              ) : (
                <a className="btn-secondary" href={hrefs[plan.tier]}>{labels.choose}</a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
