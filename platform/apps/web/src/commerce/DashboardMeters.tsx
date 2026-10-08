import {TIERS} from '@platform/shared';
import type {Invitation} from './types';
import {meters} from './meters';

export function DashboardMeters({
  invitation,
  now,
  large = false,
  labels,
}: {
  invitation: Invitation;
  now: Date;
  large?: boolean;
  labels: {edits: string; editsValue: string; days: string; daysValue: string; starts: string};
}) {
  const values = meters(invitation, now);
  const totalDays = (TIERS[invitation.tier]?.onlineMonths ?? 6) * 30;
  const daysPct =
    values.daysLeft === null
      ? 0
      : Math.min(100, Math.max(0, Math.round((values.daysLeft / totalDays) * 100)));

  return (
    <div className={`meter-grid ${large ? 'meter-grid--large' : ''}`}>
      <section className="meter-card">
        <div className="meter-header">
          <span className="meter-label">{labels.edits}</span>
          <strong className="meter-value">{labels.editsValue}</strong>
        </div>
        <div
          className="meter-track"
          role="progressbar"
          aria-label={labels.edits}
          aria-valuemin={0}
          aria-valuemax={values.editsAllowed}
          aria-valuenow={values.editsLeft}
        >
          <span
            className="meter-track__fill meter-track__fill--edits"
            style={{inlineSize: `${values.editsPct}%`}}
          />
        </div>
      </section>

      <section className="meter-card">
        <div className="meter-header">
          <span className="meter-label">{labels.days}</span>
          <strong className="meter-value">
            {values.daysLeft === null ? labels.starts : labels.daysValue}
          </strong>
        </div>
        {values.daysLeft !== null && (
          <div
            className="meter-track"
            role="progressbar"
            aria-label={labels.days}
            aria-valuemin={0}
            aria-valuemax={totalDays}
            aria-valuenow={values.daysLeft}
          >
            <span
              className="meter-track__fill meter-track__fill--days"
              style={{inlineSize: `${daysPct}%`}}
            />
          </div>
        )}
      </section>
    </div>
  );
}
