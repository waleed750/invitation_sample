import React, { useState, useRef } from "react";
import { Send, ChevronDown, MapPin, Calendar, ExternalLink, Phone } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import "./styles.css";

function BridgertonHero({ headline, firstName, secondName, displayDate, locationLine, heroVideoUrl, heroPosterUrl }) {
  const scrollDown = () => {
    const el = document.getElementById("welcome");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  // hero-bg is ambient loop (7.04s h264, distinct hashes at 0/48/96/144, loop attr in HTML, text is DOM overlay) -> loop:true overlay:true
  return (
    <section className="bg-hero" aria-labelledby="hero-title">
      <video
        className="bg-hero__video"
        src={heroVideoUrl}
        poster={heroPosterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="bg-hero__scrim" aria-hidden="true" />
      <div className="bg-hero__copy" data-reveal>
        {headline && <p className="bg-hero__eyebrow">{headline}</p>}
        {(firstName || secondName) && (
          <h1 id="hero-title" className="bg-hero__names">
            <span className="bg-hero__name">{firstName}</span>
            <span className="bg-hero__amp">&amp;</span>
            <span className="bg-hero__name">{secondName}</span>
          </h1>
        )}
        {displayDate && <p className="bg-hero__date">{displayDate}</p>}
        {locationLine && <p className="bg-hero__location">{locationLine}</p>}
        <button type="button" className="bg-hero__cue" onClick={scrollDown} aria-label="Scroll to content">
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function BridgertonWelcome({ title, body, timeLabel, venue, time, mapSearchUrl, calendarUrl, chateauUrl, venueFrameUrl }) {
  const downloadIcs = () => {
    const blob = new Blob(
      [
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//TheDigitalYes//Bridgerton//EN",
          "BEGIN:VEVENT",
          "DTSTART;TZID=Europe/Paris:20270727T190000",
          "DTEND;TZID=Europe/Paris:20270727T230000",
          `SUMMARY:Boda Lucia & Matteo`,
          `LOCATION:${venue}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
      ],
      { type: "text/calendar;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding.ics";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="bg-welcome" id="welcome" aria-labelledby="welcome-title">
      {chateauUrl && <img className="bg-welcome__chateau" src={chateauUrl} alt="Château illustration" loading="lazy" />}
      <div className="bg-welcome__frame-wrap">
        <img className="bg-welcome__frame" src={venueFrameUrl} alt="" aria-hidden="true" loading="lazy" />
        <div className="bg-welcome__inner" data-reveal>
          <h2 id="welcome-title" className="bg-script bg-welcome__title">
            {title.split("\n").map((line, i) => (
              <span key={i} className="bg-welcome__title-line">
                {line}
              </span>
            ))}
          </h2>
          {body && (
            <p className="bg-welcome__body">
              {body.split("\n").map((l, i) => (
                <span key={i}>
                  {l}
                  <br />
                </span>
              ))}
            </p>
          )}
          <div className="bg-welcome__timeblock">
            <h3 className="bg-welcome__time-label">{timeLabel}</h3>
            <p className="bg-welcome__venue">{venue}</p>
            <p className="bg-welcome__time">{time}</p>
            <div className="bg-welcome__actions">
              {mapSearchUrl && (
                <a className="bg-btn bg-btn--ghost" href={mapSearchUrl} target="_blank" rel="noreferrer">
                  <MapPin size={14} aria-hidden="true" /> Open in Google Maps
                </a>
              )}
              <button type="button" className="bg-btn bg-btn--ghost" onClick={downloadIcs}>
                <Calendar size={14} aria-hidden="true" /> Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BridgertonCountdown({ date, title, subtitle, showSeconds, drapeLeftUrl, drapeRightUrl }) {
  return (
    <div className="bg-countdown-wrap" id="countdown">
      {drapeLeftUrl && <img className="bg-countdown__drape bg-countdown__drape--left" src={drapeLeftUrl} alt="" aria-hidden="true" loading="lazy" />}
      {drapeRightUrl && <img className="bg-countdown__drape bg-countdown__drape--right" src={drapeRightUrl} alt="" aria-hidden="true" loading="lazy" />}
      <div className="bg-countdown__inner">
        <Countdown date={date} title={title} kicker={subtitle} showSeconds={showSeconds} />
      </div>
    </div>
  );
}

function BridgertonDressCode({ title, subtitle, formalDesc, noteDesc, portraitUrl, fanUrl }) {
  return (
    <section className="bg-dresscode" aria-labelledby="dresscode-title">
      <div className="section-inner" data-reveal>
        <p className="bg-kicker">{subtitle}</p>
        <h2 id="dresscode-title" className="bg-script">
          {title}
        </h2>
        <div className="bg-rule" aria-hidden="true" />
        {portraitUrl && (
          <div className="bg-dresscode__portrait">
            <img src={portraitUrl} alt="Formal attire" loading="lazy" />
          </div>
        )}
        {fanUrl && <img className="bg-dresscode__fan" src={fanUrl} alt="" aria-hidden="true" loading="lazy" />}
        <div className="bg-dresscode__texts">
          <p className="bg-dresscode__body">{formalDesc}</p>
          <p className="bg-dresscode__note">{noteDesc}</p>
        </div>
      </div>
    </section>
  );
}

function BridgertonHotels({ title, subtitle, hotels = [] }) {
  return (
    <section className="bg-hotels" aria-labelledby="hotels-title">
      <div className="section-inner" data-reveal>
        <p className="bg-kicker">{subtitle}</p>
        <h2 id="hotels-title" className="bg-script">
          {title}
        </h2>
        <div className="bg-rule" aria-hidden="true" />
        <div className="bg-hotels__grid">
          {hotels.map((h) => (
            <article key={h.name} className="bg-hotel-card">
              <h3 className="bg-hotel__name">{h.name}</h3>
              <p className="bg-hotel__location">{h.location}</p>
              {h.note && <p className="bg-hotel__note">{h.note}</p>}
              {h.link && (
                <a className="bg-btn bg-btn--ghost bg-hotel__link" href={h.link} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} aria-hidden="true" /> View hotel
                </a>
              )}
            </article>
          ))}
        </div>
        <img className="bg-hotels__fountain" src="/assets/bridgerton/fountain-urns.png" alt="" aria-hidden="true" loading="lazy" style={{ display: "none" }} />
      </div>
    </section>
  );
}

function BridgertonDiscover({ title, subtitle, categories = [], balustradeUrl, poolsUrnUrl, columnVaseUrl, fountainUrl }) {
  return (
    <section className="bg-discover" aria-labelledby="discover-title">
      <div className="section-inner" data-reveal>
        <h2 id="discover-title" className="bg-script">
          {title}
        </h2>
        <div className="bg-rule" aria-hidden="true" />
        {subtitle && <p className="bg-discover__subtitle">{subtitle}</p>}
        <div className="bg-discover__categories">
          {categories.map((cat) => (
            <div key={cat.heading} className="bg-discover__cat">
              <h3 className="bg-discover__cat-title">{cat.heading}</h3>
              <div className="bg-discover__cat-grid">
                {cat.items.map((it) => (
                  <div key={it.name} className="bg-discover__item">
                    <p className="bg-discover__item-name">{it.name}</p>
                    <p className="bg-discover__item-loc">{it.location}</p>
                    {it.contact && (
                      <a className="bg-discover__item-phone" href={`tel:${it.contact.replace(/\s/g, "")}`}>
                        <Phone size={12} aria-hidden="true" /> {it.contact}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {fountainUrl && <img className="bg-discover__fountain" src={fountainUrl} alt="" aria-hidden="true" loading="lazy" />}
      </div>
      {balustradeUrl && <img className="bg-discover__balustrade" src={balustradeUrl} alt="" aria-hidden="true" loading="lazy" />}
      {poolsUrnUrl && <img className="bg-discover__pools" src={poolsUrnUrl} alt="" aria-hidden="true" loading="lazy" />}
      {columnVaseUrl && <img className="bg-discover__column" src={columnVaseUrl} alt="" aria-hidden="true" loading="lazy" />}
    </section>
  );
}

function BridgertonGifts({ title, intro, cakeUrl, tasselPinkUrl, tasselGoldUrl, bankDetails }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="bg-gifts" aria-labelledby="gifts-title">
      {tasselPinkUrl && <img className="bg-gifts__tassel bg-gifts__tassel--left" src={tasselPinkUrl} alt="" aria-hidden="true" loading="lazy" />}
      {tasselGoldUrl && <img className="bg-gifts__tassel bg-gifts__tassel--right" src={tasselGoldUrl} alt="" aria-hidden="true" loading="lazy" />}
      <div className="section-inner narrow" data-reveal>
        {cakeUrl && <img className="bg-gifts__cake" src={cakeUrl} alt="Wedding cake" loading="lazy" />}
        <h2 id="gifts-title" className="bg-script">
          {title}
        </h2>
        <div className="bg-rule" aria-hidden="true" />
        <p className="bg-gifts__intro">{intro}</p>
        <button
          type="button"
          className={`bg-gifts__trigger ${open ? "is-open" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span>Reveal bank details</span>
          <ChevronDown size={16} className={open ? "is-open" : ""} aria-hidden="true" />
        </button>
        {open && bankDetails && (
          <div className="bg-gifts__panel">
            <h3 className="bg-gifts__panel-title">{bankDetails.label}</h3>
            <dl className="bg-gifts__dl">
              <div>
                <dt>Bank</dt>
                <dd>{bankDetails.bank}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{bankDetails.address}</dd>
              </div>
              <div>
                <dt>Account Holders</dt>
                <dd>{bankDetails.holders}</dd>
              </div>
              <div>
                <dt>IBAN</dt>
                <dd className="is-mono">{bankDetails.iban}</dd>
              </div>
              <div>
                <dt>SWIFT/BIC</dt>
                <dd className="is-mono">{bankDetails.bic}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

function BridgertonRsvp({ title, deadlineNote, deadlineDate, floralFrameUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState("yes");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [allergies, setAllergies] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmAttending, setConfirmAttending] = useState("yes");

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatus("Please enter your full name.");
      return;
    }
    setConfirmAttending(attending);
    setConfirmed(true);
    setStatus("");
  }

  if (confirmed) {
    if (confirmAttending === "no") {
      return (
        <section className="bg-rsvp bg-rsvp--thanks" id="rsvp">
          <div className="section-inner narrow" data-reveal>
            <h2 className="bg-script">Thank you for letting us know</h2>
            <p className="bg-rsvp__thanks">We&apos;re sorry you can&apos;t join us. You&apos;ll be in our thoughts on this very special day.</p>
            <p className="bg-script bg-rsvp__sig">— Lucia &amp; Matteo</p>
          </div>
        </section>
      );
    }
    return (
      <section className="bg-rsvp__confirm-wrap" id="rsvp" aria-live="polite">
        <div className="bg-rsvp__thanks-stage">
          <h2 className="bg-script">Thank you for confirming</h2>
          <p className="bg-rsvp__thanks">We&apos;re so happy you&apos;ll be joining us.</p>
          <p className="bg-rsvp__thanks">We look forward to seeing you on July 27th at Château de la Couronne, Nouvelle-Aquitaine.</p>
          <p className="bg-script bg-rsvp__sig">— Lucia &amp; Matteo</p>
          <p className="bg-rsvp__cancel">If you can no longer attend, please let us know before 28 August.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-rsvp"
      id="rsvp"
      aria-labelledby="rsvp-title"
      style={floralFrameUrl ? { backgroundImage: `url(${floralFrameUrl})` } : undefined}
    >
      <div className="bg-rsvp__overlay" aria-hidden="true" />
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title" className="bg-script">
          {title}
        </h2>
        <div className="bg-rule" aria-hidden="true" />
        <p className="bg-rsvp__deadline">
          {deadlineNote} <strong>{deadlineDate}</strong>.
        </p>
        <form className="bg-rsvp__form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Will you attend? *</legend>
            <label className="bg-radio">
              <input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} /> Yes, I&apos;ll be there
            </label>
            <label className="bg-radio">
              <input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} /> Sorry, I can&apos;t make it
            </label>
          </fieldset>

          <label>
            Full name *<input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label>
            Allergies or dietary requirements
            <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. vegetarian, gluten-free, nut allergy" />
          </label>
          <label>
            A message for the couple<textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share a wish, a memory, or a note…" />
          </label>

          <button type="submit" className="bg-rsvp__submit">
            <Send size={16} aria-hidden="true" /> Send RSVP
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function BridgertonFooter({ names, date, venue, creditLine, creditName, creditUrl }) {
  return (
    <footer className="bg-footer">
      <p className="bg-script bg-footer__names">{names}</p>
      <p className="bg-footer__date">{date}</p>
      <p className="bg-footer__venue">{venue}</p>
      {creditLine && creditName && (
        <p className="bg-footer__credit">
          {creditLine} {creditUrl ? <a href={creditUrl} target="_blank" rel="noreferrer">{creditName}</a> : creditName}
        </p>
      )}
    </footer>
  );
}

const sectionComponents = {
  hero: BridgertonHero,
  welcome: BridgertonWelcome,
  countdown: BridgertonCountdown,
  dressCode: BridgertonDressCode,
  hotelList: BridgertonHotels,
  discover: BridgertonDiscover,
  gifts: BridgertonGifts,
  rsvp: BridgertonRsvp,
  credit: BridgertonFooter,
};

export function BridgertonInvitation() {
  const { theme, media, copy, sections } = invitationData;
  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="bg-shell"
      contentClassName="bg-content"
    />
  );
}
