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
 */
export default function Rsvp({ title, subtitle, bgUrl, bottomUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState(null);
  const [guestCount, setGuestCount] = useState(1);

  function handleSubmit(event) {
    event.preventDefault();
    setStatus("Thank you! Your RSVP is saved locally for this preview.");
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
              Yes, I'll be there
            </label>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="no"
                onChange={() => setAttending(false)}
              />
              Unfortunately, I can't make it
            </label>
          </fieldset>

          <label>
            Full name *
            <input name="fullName" type="text" maxLength="100" placeholder="Enter your name" required />
          </label>

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

          <label>
            Email address
            <input name="email" type="email" maxLength="120" placeholder="you@example.com" required />
          </label>

          <label className="rsvp-checkbox">
            <input type="checkbox" name="children" />
            Will any children be attending?
          </label>

          <button type="submit">
            <Send size={17} aria-hidden="true" />
            Send RSVP
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
