import React, { useState } from "react";
import { Send } from "lucide-react";

/**
 * RSVP form section — attendance, name, guests, email, children.
 * Local state only, no backend. Mirrors MessageForm's fake-submit pattern.
 *
 * Props:
 *   title       — section heading (e.g. "RSVP")
 *   subtitle    — kicker text
 *   bgUrl       — background/decoration image (optional)
 *   bottomUrl   — bottom decoration image (optional)
 *   attendanceOptions — custom attending radio labels (optional)
 *   eventOptions — required event checkbox labels (optional)
 *   guestCountMode — "select" or "stepper" (default "select")
 *   nameFieldLabel — label for guest name (default "Full name *")
 *   childrenMode — "checkbox" or "radios" (default "checkbox")
 *   submitLabel — submit button label (default "Send RSVP")
 */
export default function Rsvp({
  title,
  subtitle,
  bgUrl,
  bottomUrl,
  attendanceOptions,
  eventOptions,
  guestCountMode = "select",
  nameFieldLabel = "Full name *",
  childrenMode = "checkbox",
  childrenLabel = "Will any children be attending?",
  submitLabel = "Send RSVP",
}) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const yesLabel = attendanceOptions?.yes || "Yes, I'll be there";
  const noLabel = attendanceOptions?.no || "Unfortunately, I can't make it";

  function updateGuestCount(nextValue) {
    setGuestCount(Math.min(8, Math.max(1, Number(nextValue) || 1)));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (eventOptions?.length && selectedEvents.length === 0) {
      setStatus("Please choose at least one event before submitting.");
      return;
    }
    setStatus("Thank you! Your RSVP is saved locally for this preview.");
  }

  function toggleEvent(value) {
    setSelectedEvents((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <section className="rsvp-section" aria-labelledby="rsvp-title">
      {bgUrl && (
        <img className="rsvp-decoration" src={bgUrl} alt="" aria-hidden="true" />
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title">{title}</h2>
        <p className="section-kicker">{subtitle}</p>
        <form className="rsvp-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Will you be attending? *</legend>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="yes"
                required
                onChange={() => setAttending(true)}
              />
              {yesLabel}
            </label>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="no"
                onChange={() => setAttending(false)}
              />
              {noLabel}
            </label>
          </fieldset>

          {eventOptions?.length ? (
            <fieldset>
              <legend>Which events will you be attending? *</legend>
              {eventOptions.map((option, index) => (
                <label className="rsvp-checkbox" key={option.value || option.label}>
                  <input
                    type="checkbox"
                    name="events"
                    value={option.value || option.label}
                    checked={selectedEvents.includes(option.value || option.label)}
                    aria-required={index === 0 ? "true" : undefined}
                    onChange={() => toggleEvent(option.value || option.label)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          ) : null}

          <label>
            {nameFieldLabel}
            <input name="fullName" type="text" maxLength="100" placeholder="Enter your name" required />
          </label>

          {guestCountMode === "stepper" ? (
            <label>
              How many guests in total?
              <div className="guest-stepper">
                <button type="button" aria-label="Decrease guest count" onClick={() => updateGuestCount(guestCount - 1)}>
                  -
                </button>
                <input
                  name="guestCount"
                  type="number"
                  min="1"
                  max="8"
                  value={guestCount}
                  onChange={(e) => updateGuestCount(e.target.value)}
                />
                <button type="button" aria-label="Increase guest count" onClick={() => updateGuestCount(guestCount + 1)}>
                  +
                </button>
              </div>
            </label>
          ) : (
            <label>
              How many guests in total?
              <select name="guestCount" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Email address
            <input name="email" type="email" maxLength="120" placeholder="you@example.com" required />
          </label>

          {childrenMode === "radios" ? (
            <fieldset>
              <legend>{childrenLabel}</legend>
              <label className="rsvp-radio">
                <input type="radio" name="children" value="yes" />
                Yes
              </label>
              <label className="rsvp-radio">
                <input type="radio" name="children" value="no" />
                No
              </label>
            </fieldset>
          ) : (
            <label className="rsvp-checkbox">
              <input type="checkbox" name="children" />
              {childrenLabel}
            </label>
          )}

          <button type="submit">
            <Send size={17} aria-hidden="true" />
            {submitLabel}
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </div>
      {bottomUrl && (
        <img className="rsvp-bottom-decoration" src={bottomUrl} alt="" aria-hidden="true" />
      )}
    </section>
  );
}
