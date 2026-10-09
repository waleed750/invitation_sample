import type {PickDetails, PickParseResult} from './params';
import {NAME_MAX} from './params';

export type DetailsFormLabels = {
  title: string;
  lead: string;
  first: string;
  firstPlaceholder: string;
  second: string;
  secondPlaceholder: string;
  date: string;
  submit: string;
  errors: {missing: string; invalid: string; past: string};
};

type Props = {
  action: string;
  values: PickDetails;
  errors: PickParseResult['errors'];
  /** Only show validation messages after the customer submitted the form. */
  showErrors: boolean;
  min: string;
  labels: DetailsFormLabels;
};

/** A plain GET form: details live in the URL, so the page is shareable and back-button friendly. */
export function DetailsForm({action, values, errors, showErrors, min, labels}: Props) {
  const message = (code: 'missing' | 'invalid' | 'past' | undefined) =>
    showErrors && code ? <p className="pick-field__error" role="alert">{labels.errors[code]}</p> : null;
  return (
    <form className="pick-details" action={action} method="get">
      <h2 className="pick-section-title">{labels.title}</h2>
      <p className="pick-lead">{labels.lead}</p>
      <div className="pick-details__fields">
        <label className="pick-field">
          <span>{labels.first}</span>
          <input
            name="first"
            type="text"
            defaultValue={values.first}
            placeholder={labels.firstPlaceholder}
            maxLength={NAME_MAX}
            autoComplete="off"
            required
          />
          {message(errors.first)}
        </label>
        <label className="pick-field">
          <span>{labels.second}</span>
          <input
            name="second"
            type="text"
            defaultValue={values.second}
            placeholder={labels.secondPlaceholder}
            maxLength={NAME_MAX}
            autoComplete="off"
            required
          />
          {message(errors.second)}
        </label>
        <label className="pick-field">
          <span>{labels.date}</span>
          <input name="date" type="date" defaultValue={values.date} min={min} required />
          {message(errors.date)}
        </label>
      </div>
      <button className="btn-primary" type="submit">{labels.submit}</button>
    </form>
  );
}
