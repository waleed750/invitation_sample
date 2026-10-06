import type {Invitation} from './types';
import {meters} from './meters';

export function DashboardMeters({invitation, now, large = false, labels}: {
  invitation: Invitation;
  now: Date;
  large?: boolean;
  labels: {edits: string; editsValue: string; days: string; daysValue: string; starts: string};
}) {
  const values = meters(invitation, now);
  return <div className={`meter-grid${large ? ' large' : ''}`}>
    <section className="meter"><div><span>{labels.edits}</span><strong>{labels.editsValue}</strong></div><div className="meter-track" role="progressbar" aria-label={labels.edits} aria-valuemin={0} aria-valuemax={values.editsAllowed} aria-valuenow={values.editsLeft}><span style={{inlineSize: `${values.editsPct}%`}} /></div></section>
    <section className="meter"><div><span>{labels.days}</span><strong>{values.daysLeft === null ? labels.starts : labels.daysValue}</strong></div>{values.daysLeft !== null && <div className="days-rule" aria-hidden="true"><span /></div>}</section>
  </div>;
}
