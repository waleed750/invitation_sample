import React, { useState } from "react";
import { Send } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Welcome from "../../shared/sections/Welcome.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import "./styles.css";

function MaldivesHero({ headline, firstName, secondName, displayDate, heroBgUrl, monogramUrl, location, dateStart, dateEnd, ctaLabel, palmLeftUrl, palmRightUrl, islandCenterUrl, hangingLightsUrl }) {
  return (
    <section className="md-hero" aria-labelledby="hero-title">
      <div className="md-hero__bg">
        <img className="md-hero__bg-img" src={heroBgUrl} alt="" draggable="false" />
      </div>
      <div className="md-hero__gradient" />
      <div className="md-hero__copy">
        {monogramUrl && <img className="md-hero__monogram" src={monogramUrl} alt="" aria-hidden="true" />}
        <h1 id="hero-title">
          {firstName} <span className="md-hero__amp">&amp;</span> {secondName}
        </h1>
        <p className="md-hero__headline">{headline}</p>
        {location && (
          <>
            <p className="md-hero__in">in</p>
            <p className="md-hero__location">{location}</p>
          </>
        )}
        {(dateStart || dateEnd) && (
          <div className="md-hero__dates">
            {dateStart && (
              <div className="md-hero__date-badge">
                <div className="md-hero__date-line" />
                <span>{dateStart}</span>
              </div>
            )}
            {dateStart && dateEnd && <span className="md-hero__date-dash">&mdash;</span>}
            {dateEnd && (
              <div className="md-hero__date-badge">
                <div className="md-hero__date-line" />
                <span>{dateEnd}</span>
              </div>
            )}
          </div>
        )}
        {ctaLabel && <p className="md-hero__cta">{ctaLabel}</p>}
      </div>
      {hangingLightsUrl && <img className="md-hero__lights" src={hangingLightsUrl} alt="" aria-hidden="true" />}
      {palmLeftUrl && <img className="md-hero__palm md-hero__palm--left" src={palmLeftUrl} alt="" aria-hidden="true" />}
      {palmRightUrl && <img className="md-hero__palm md-hero__palm--right" src={palmRightUrl} alt="" aria-hidden="true" />}
      {islandCenterUrl && <img className="md-hero__island" src={islandCenterUrl} alt="" aria-hidden="true" />}
    </section>
  );
}

function MaldivesDressCode({ title, events }) {
  return (
    <section className="md-dresscode" aria-labelledby="dresscode-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="dresscode-title">{title}</h2>
        {events.map((ev, i) => (
          <div key={i} className="md-dresscode__event">
            <p className="md-dresscode__event-title">{ev.title}</p>
            <p className="md-dresscode__event-date">{ev.dateLabel}</p>
            {ev.colors && ev.colors.length > 0 && (
              <div className="md-dresscode__colors">
                {ev.colors.map((color, j) => (
                  <div key={j} className="md-dresscode__color">
                    {color.swatchUrl && (
                      <img className="md-dresscode__swatch" src={color.swatchUrl} alt={color.name} />
                    )}
                    <span className="md-dresscode__color-name">{color.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MaldivesTravel({ eyebrow, title, body, venueLocation, venueImageUrl }) {
  return (
    <section className="md-travel" aria-labelledby="travel-title">
      <div className="section-inner narrow" data-reveal>
        {eyebrow && <p className="md-travel__eyebrow">{eyebrow}</p>}
        <h2 id="travel-title">{title}</h2>
        <p className="md-travel__body">{body}</p>
        {venueLocation && <p className="md-travel__location">{venueLocation}</p>}
        {venueImageUrl && (
          <img className="md-travel__venue-img" src={venueImageUrl} alt="" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}

function MaldivesRsvp({ title, subtitle, events }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState(null);
  const [guestCount, setGuestCount] = useState(1);

  function handleSubmit(e) {
    e.preventDefault();
    setStatus("Thank you! Your RSVP has been submitted.");
  }

  return (
    <section className="md-rsvp" aria-labelledby="rsvp-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title">{title}</h2>
        {subtitle && <p className="section-kicker">{subtitle}</p>}
        <form className="md-rsvp__form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Will you be joining us? *</legend>
            <label className="rsvp-radio">
              <input type="radio" name="attending" value="yes" required onChange={() => setAttending(true)} />
              Delighted to accept
            </label>
            <label className="rsvp-radio">
              <input type="radio" name="attending" value="no" onChange={() => setAttending(false)} />
              Regretfully unable to attend
            </label>
          </fieldset>

          {attending && events && (
            <fieldset>
              <legend>Which events will you be attending? *</legend>
              {events.map((evt, i) => (
                <label key={i} className="rsvp-checkbox">
                  <input type="checkbox" name={`event-${i}`} />
                  {evt}
                </label>
              ))}
            </fieldset>
          )}

          {attending && (
            <label>
              Number of guests in your party
              <div className="md-rsvp__counter">
                <button type="button" disabled={guestCount <= 1} onClick={() => setGuestCount((c) => Math.max(1, c - 1))}>-</button>
                <span>{guestCount}</span>
                <button type="button" onClick={() => setGuestCount((c) => Math.min(10, c + 1))}>+</button>
              </div>
            </label>
          )}

          {attending && (
            <label className="rsvp-checkbox">
              <input type="checkbox" name="children" />
              Will any children be accompanying you?
            </label>
          )}

          <label>
            A message for the couple
            <textarea name="message" maxLength="1000" rows="3" placeholder="Share a wish or a message..." />
          </label>

          <button type="submit">
            <Send size={17} aria-hidden="true" />
            Submit Response
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function MaldivesFooter({ names, date, creditLine, creditName, monogramUrl }) {
  return (
    <footer className="md-footer">
      {monogramUrl && <img className="md-footer__monogram" src={monogramUrl} alt="" aria-hidden="true" />}
      <div className="md-footer__copy">
        {names && <strong>{names}</strong>}
        {date && <span>{date}</span>}
        {creditLine && (
          <p className="md-footer__credit">
            {creditLine} {creditName}
          </p>
        )}
      </div>
    </footer>
  );
}

const sectionComponents = {
  hero: MaldivesHero,
  countdown: Countdown,
  welcome: Welcome,
  schedule: Schedule,
  dressCode: MaldivesDressCode,
  travelInfo: MaldivesTravel,
  rsvp: MaldivesRsvp,
  footer: MaldivesFooter,
};

export function MaldivesInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="md-shell"
      contentClassName="md-content"
    />
  );
}
