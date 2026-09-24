import React, { useState, useRef } from "react";
import { ChevronDown, MapPin, Calendar, Phone, ExternalLink, Send, Car, Bus, Flower2 } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import "./styles.css";

function BloomHero({ headline, firstName, secondName, displayDate, ctaLabel, heroBgUrl }) {
  const scrollDown = () => {
    const el = document.getElementById("countdown");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  // hero is static image, not video — no loop logic needed. Text is DOM overlay (arch SVG), not baked.
  return (
    <section className="bloom-hero" id="hero" aria-labelledby="hero-title">
      <div className="bloom-hero__bg" aria-hidden="true" style={heroBgUrl ? { backgroundImage: `url(${heroBgUrl})` } : undefined} />
      <div className="bloom-hero__content">
        <div className="bloom-hero__arch-wrap">
          <svg aria-label={headline} className="bloom-hero__arch bloom-hero__arch--mobile" viewBox="-20 -160 440 380">
            <defs>
              <path d="M 20,200 Q 200,-360 380,200" fill="none" id="bloom-arch-mobile" />
            </defs>
            <text className="bloom-hero__arch-text" textAnchor="middle">
              <textPath href="#bloom-arch-mobile" startOffset="50%">{headline?.toUpperCase()}</textPath>
            </text>
          </svg>
          <svg aria-label={headline} className="bloom-hero__arch bloom-hero__arch--desktop" viewBox="0 0 400 120">
            <defs>
              <path d="M 20,110 Q 200,30 380,110" fill="none" id="bloom-arch-desktop" />
            </defs>
            <text className="bloom-hero__arch-text" textAnchor="middle">
              <textPath href="#bloom-arch-desktop" startOffset="50%">{headline?.toUpperCase()}</textPath>
            </text>
          </svg>
        </div>
        <h1 id="hero-title" className="bloom-hero__names">
          <span className="bloom-hero__name">{firstName}</span>
          <span className="bloom-hero__amp">&amp;</span>
          <span className="bloom-hero__name">{secondName}</span>
        </h1>
        {displayDate && <p className="bloom-hero__date">{displayDate}</p>}
      </div>
      <button type="button" className="bloom-hero__cue" onClick={scrollDown} aria-label="Scroll to content">
        <span>{ctaLabel || "Discover"}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

function BloomCountdown({ date, title, subtitle, showSeconds, frameUrl }) {
  return (
    <section className="bloom-countdown" id="countdown" aria-labelledby="countdown-title">
      <div className="bloom-countdown__frame" style={frameUrl ? { backgroundImage: `url(${frameUrl})` } : undefined}>
        <div className="bloom-countdown__inner">
          <Countdown date={date} title={title} kicker={subtitle} showSeconds={showSeconds} />
        </div>
      </div>
    </section>
  );
}

function BloomWelcome({ title, parents, body, dateLine, dayLabel, flowersTopUrl, flowersBottomUrl }) {
  return (
    <section className="bloom-welcome" id="welcome" aria-labelledby="welcome-title">
      {flowersTopUrl && <img className="bloom-welcome__flowers bloom-welcome__flowers--top" src={flowersTopUrl} alt="" aria-hidden="true" loading="lazy" />}
      {flowersBottomUrl && <img className="bloom-welcome__flowers bloom-welcome__flowers--bottom" src={flowersBottomUrl} alt="" aria-hidden="true" loading="lazy" />}
      <div className="section-inner" data-reveal>
        <h2 id="welcome-title" className="bloom-script bloom-welcome__title">{title}</h2>
        {parents && <p className="bloom-welcome__parents">{parents}</p>}
        {(body) && (
          <div className="bloom-welcome__couple">
            <h3 className="bloom-welcome__couple-name">Martina</h3>
            <p className="bloom-welcome__and">and</p>
            <h3 className="bloom-welcome__couple-name">Javier</h3>
          </div>
        )}
        <p className="bloom-welcome__body">{body}</p>
        <div className="bloom-welcome__date">
          {dayLabel && <span className="bloom-welcome__day">{dayLabel}</span>}
          {dateLine && <p className="bloom-welcome__dateline">{dateLine.split("\n").map((l, i) => (<span key={i}>{l}<br /></span>))}</p>}
        </div>
      </div>
    </section>
  );
}

function BloomCeremony({ title, subtitle, venue, locationLine, date, time, street, zip, mapSearchUrl, calendarUrl, ovalBgUrl, venueIllustrationUrl }) {
  const downloadIcs = () => {
    const blob = new Blob(
      [[
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TheDigitalYes//Bloom//EN",
        "BEGIN:VEVENT",
        "DTSTART;TZID=Europe/Paris:20260927T173000",
        "DTEND;TZID=Europe/Paris:20260928T013000",
        "SUMMARY:Martina & Javier – Wedding",
        `LOCATION:${venue}, ${locationLine}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")],
      { type: "text/calendar;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "wedding.ics"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <section className="bloom-ceremony" id="wedding-events" aria-labelledby="ceremony-title">
      <div className="bloom-ceremony__oval" style={ovalBgUrl ? { backgroundImage: `url(${ovalBgUrl})` } : undefined}>
        {venueIllustrationUrl && <img className="bloom-ceremony__venue-img" src={venueIllustrationUrl} alt="Venue illustration" loading="lazy" />}
        <div className="bloom-ceremony__copy" data-reveal>
          <h2 id="ceremony-title" className="bloom-ceremony__title">{title.split("\n").map((l, i) => (<span key={i}>{l}<br /></span>))}</h2>
          <span className="bloom-rule" aria-hidden="true" />
          <p className="bloom-kicker">{subtitle}</p>
          <h3 className="bloom-ceremony__venue">{venue}</h3>
          <p className="bloom-kicker bloom-ceremony__loc">{locationLine}</p>
          <div className="bloom-ceremony__meta">
            <span className="bloom-ceremony__date">{date}</span>
            <span className="bloom-ceremony__dot" aria-hidden="true">·</span>
            <span className="bloom-ceremony__time">{time}</span>
          </div>
          <div className="bloom-ceremony__address">
            <span>{street}</span>
            <span className="is-muted">{zip}</span>
          </div>
        </div>
      </div>
      <div className="bloom-ceremony__actions">
        {mapSearchUrl && <a className="bloom-btn bloom-btn--ghost" href={mapSearchUrl} target="_blank" rel="noreferrer"><MapPin size={14} aria-hidden="true" /> Open in Maps</a>}
        <button type="button" className="bloom-btn bloom-btn--ghost" onClick={downloadIcs}><Calendar size={14} aria-hidden="true" /> Add to Calendar</button>
      </div>
    </section>
  );
}

function BloomDressCode({ title, subtitle, frameUrl, illustrationUrl }) {
  return (
    <section className="bloom-dresscode" aria-labelledby="dresscode-title">
      <div className="bloom-dresscode__frame" style={frameUrl ? { backgroundImage: `url(${frameUrl})` } : undefined}>
        <div className="bloom-dresscode__inner" data-reveal>
          <h2 id="dresscode-title" className="bloom-script bloom-dresscode__title">{title}</h2>
          <span className="bloom-rule" aria-hidden="true" />
          <p className="bloom-dresscode__subtitle">{subtitle}</p>
          {illustrationUrl && <img className="bloom-dresscode__illus" src={illustrationUrl} alt="Black tie illustration" loading="lazy" />}
        </div>
      </div>
    </section>
  );
}

function BloomProgramme({ title, frameUrl, items = [] }) {
  return (
    <section className="bloom-programme" aria-labelledby="programme-title">
      <div className="section-inner" data-reveal>
        <h2 id="programme-title" className="bloom-script">{title}</h2>
      </div>
      <div className="bloom-programme__frame" style={frameUrl ? { backgroundImage: `url(${frameUrl})` } : undefined}>
        <div className="bloom-programme__list">
          {items.map((it) => (
            <div key={it.label} className="bloom-programme__item">
              <p className="bloom-programme__time">{it.time}</p>
              <p className="bloom-programme__label">{it.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BloomStory({ title, buttonLabel, stories = [], butterflyUrls = [], butterflyPairLeft, butterflyPairRight, gallery = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="bloom-story" id="our-story" aria-labelledby="story-title">
      <div className="section-inner" data-reveal>
        <div className="bloom-story__butterflies">
          {butterflyPairLeft && <img src={butterflyPairLeft} alt="" aria-hidden="true" loading="lazy" />}
          {butterflyPairRight && <img src={butterflyPairRight} alt="" aria-hidden="true" loading="lazy" className="is-mirrored" />}
        </div>
        <h2 id="story-title" className="bloom-script">{title}</h2>
        <button type="button" className="bloom-story__toggle" aria-expanded={open} aria-controls="our-story-content" onClick={() => setOpen(!open)}>
          {open ? "Hide Story" : buttonLabel}
        </button>
        {open && (
          <div id="our-story-content" className="bloom-story__content">
            {stories.map((s, idx) => (
              <div key={idx} className="bloom-story__paragraph-wrap">
                {butterflyUrls[(idx * 2) % butterflyUrls.length] && <img className="bloom-story__butterfly bloom-story__butterfly--left" src={butterflyUrls[(idx * 2) % butterflyUrls.length]} alt="" aria-hidden="true" loading="lazy" />}
                {butterflyUrls[(idx * 2 + 1) % butterflyUrls.length] && <img className="bloom-story__butterfly bloom-story__butterfly--right is-mirrored" src={butterflyUrls[(idx * 2 + 1) % butterflyUrls.length]} alt="" aria-hidden="true" loading="lazy" />}
                <p className="bloom-story__text">{s}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {gallery.length > 0 && (
        <div className="bloom-gallery">
          <div className="bloom-gallery__track">
            {[...gallery, ...gallery].map((src, i) => (
              <div key={i} className="bloom-gallery__item" aria-hidden={i >= gallery.length ? "true" : undefined}>
                <img src={src} alt={i < gallery.length ? `Gallery moment ${i + 1}` : ""} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function BloomWeekend({ title, subtitle, eventTitle, city, date, time, street, zip, churchUrl, flowerUrl, hummingbirdUrl, starfishUrl, orangesUrl }) {
  return (
    <section className="bloom-weekend" id="important-info" aria-labelledby="weekend-title">
      <div className="section-inner" data-reveal>
        {churchUrl && <img className="bloom-weekend__church" src={churchUrl} alt="" aria-hidden="true" loading="lazy" />}
        <h2 id="weekend-title" className="bloom-script">{title}</h2>
        <span className="bloom-rule" aria-hidden="true" />
        <p className="bloom-kicker">{subtitle}</p>
        <div className="bloom-weekend__card">
          {flowerUrl && <img className="bloom-weekend__flower" src={flowerUrl} alt="" aria-hidden="true" loading="lazy" />}
          {hummingbirdUrl && <img className="bloom-weekend__hummingbird" src={hummingbirdUrl} alt="" aria-hidden="true" loading="lazy" />}
          {starfishUrl && <img className="bloom-weekend__starfish" src={starfishUrl} alt="" aria-hidden="true" loading="lazy" />}
          <h3 className="bloom-weekend__event">{eventTitle}</h3>
          <p className="bloom-kicker bloom-weekend__city">{city}</p>
          <div className="bloom-weekend__meta">
            <span className="bloom-weekend__date">{date}</span>
            <span className="bloom-weekend__dot" aria-hidden="true">·</span>
            <span>{time}</span>
          </div>
          <div className="bloom-weekend__address">
            <span>{street}</span>
            <span className="is-muted">{zip}</span>
          </div>
          <div className="bloom-weekend__actions">
            <a className="bloom-btn bloom-btn--ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(street + ", " + zip)}`} target="_blank" rel="noreferrer"><MapPin size={14} aria-hidden="true" /> Open in Maps</a>
            <a className="bloom-btn bloom-btn--ghost" href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Welcome%20Party%20Martina%20%26%20Javier&dates=20260926T153000Z/20260926T183000Z&location=Restaurant%20C%C3%A9sar%2C%20Plage%20Keller%20Antibes" target="_blank" rel="noreferrer"><Calendar size={14} aria-hidden="true" /> Add to Calendar</a>
          </div>
        </div>
        {orangesUrl && <img className="bloom-weekend__oranges" src={orangesUrl} alt="" aria-hidden="true" loading="lazy" />}
      </div>
    </section>
  );
}

function BloomHotels({ title, subtitle, hotels = [] }) {
  return (
    <section className="bloom-hotels" id="accommodations" aria-labelledby="hotels-title">
      <div className="section-inner" data-reveal>
        <h2 id="hotels-title" className="bloom-script">{title}</h2>
        <span className="bloom-rule" aria-hidden="true" />
        <p className="bloom-hotels__subtitle">{subtitle}</p>
        <div className="bloom-hotels__grid">
          {hotels.map((h) => (
            <article key={h.name} className="bloom-hotel-card">
              {h.keyUrl && <img className="bloom-hotel__deco bloom-hotel__deco--key" src={h.keyUrl} alt="" aria-hidden="true" loading="lazy" />}
              {h.bellhopUrl && <img className="bloom-hotel__deco bloom-hotel__deco--bellhop" src={h.bellhopUrl} alt="" aria-hidden="true" loading="lazy" />}
              {h.archwayUrl && <img className="bloom-hotel__deco bloom-hotel__deco--archway" src={h.archwayUrl} alt="" aria-hidden="true" loading="lazy" />}
              {h.poolUrl && <img className="bloom-hotel__deco bloom-hotel__deco--pool" src={h.poolUrl} alt="" aria-hidden="true" loading="lazy" />}
              {h.eyebrow && <p className="bloom-kicker bloom-hotel__eyebrow">{h.eyebrow}</p>}
              <h3 className="bloom-hotel__name">{h.name}</h3>
              <p className="bloom-hotel__location">{h.location}</p>
              {h.dates && (
                <dl className="bloom-hotel__dl">
                  <div>
                    <dt>Block Dates</dt>
                    <dd>{h.dates}</dd>
                  </div>
                  {h.rates && (
                    <div>
                      <dt>Rates</dt>
                      <dd>{h.rates.map((r) => <span key={r}>{r}<br /></span>)}</dd>
                    </div>
                  )}
                  {h.bookBy && <p className="bloom-hotel__bookby">{h.bookBy}</p>}
                  {h.reference && <p className="bloom-hotel__ref">{h.reference.split("\n").map((l, i) => (<span key={i}>{l}<br /></span>))}</p>}
                </dl>
              )}
              <div className="bloom-hotel__links">
                {h.phone && <a href={`tel:${h.phone.replace(/\s/g, "")}`}><Phone size={12} aria-hidden="true" /> {h.phone}</a>}
                {h.mapsQuery && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.mapsQuery)}`} target="_blank" rel="noreferrer"><ExternalLink size={12} aria-hidden="true" /> Google Maps</a>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BloomTransport({ title, subtitle, body, note, address, mapsUrl, butterflyUrl, palmsUrl, surfboardUrl, shellUrl, carUrl }) {
  return (
    <section className="bloom-transport" aria-labelledby="transport-title">
      {butterflyUrl && <img className="bloom-transport__butterfly" src={butterflyUrl} alt="" aria-hidden="true" loading="lazy" />}
      <div className="section-inner" data-reveal>
        <h2 id="transport-title" className="bloom-script">{title}</h2>
        <span className="bloom-rule" aria-hidden="true" />
        <p className="bloom-kicker">{subtitle}</p>
        <div className="bloom-transport__card">
          {palmsUrl && <img className="bloom-transport__palms" src={palmsUrl} alt="" aria-hidden="true" loading="lazy" />}
          {surfboardUrl && <img className="bloom-transport__surf" src={surfboardUrl} alt="" aria-hidden="true" loading="lazy" />}
          {shellUrl && <img className="bloom-transport__shell" src={shellUrl} alt="" aria-hidden="true" loading="lazy" />}
          <div className="bloom-transport__grid">
            <div className="bloom-transport__option">
              <div className="bloom-transport__icon"><Bus size={16} aria-hidden="true" /></div>
              <h3>Shuttle Service</h3>
              <p className="bloom-kicker">Sunday, September 27</p>
              <p>Complimentary shuttles from Hôtel Belles Rives to the venue.</p>
            </div>
            <div className="bloom-transport__option">
              <div className="bloom-transport__icon"><Car size={16} aria-hidden="true" /></div>
              <h3>Valet Parking</h3>
              <p className="bloom-kicker">At the Venue</p>
              <p>Complimentary valet for guests who prefer to drive.</p>
            </div>
          </div>
          <span className="bloom-rule" aria-hidden="true" />
          <p className="bloom-transport__body">{body}</p>
          {note && <p className="bloom-transport__note">{note}</p>}
          <div className="bloom-transport__address">
            <p>{address?.split("\n").map((l, i) => (<span key={i}>{l}<br /></span>))}</p>
            {mapsUrl && <a className="bloom-btn bloom-btn--ghost" href={mapsUrl} target="_blank" rel="noreferrer"><MapPin size={14} aria-hidden="true" /> Google Maps</a>}
          </div>
          {carUrl && <img className="bloom-transport__car" src={carUrl} alt="" aria-hidden="true" loading="lazy" />}
        </div>
      </div>
    </section>
  );
}

function BloomRsvp({ title, subtitle, portraitUrl, floralTopUrl, floralBottomUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState("yes");
  const [fullName, setFullName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [guestNames, setGuestNames] = useState([]);
  const [transport, setTransport] = useState("shuttle");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmAttending, setConfirmAttending] = useState("yes");

  const updateGuestCount = (n) => {
    const v = Math.max(1, Math.min(10, n));
    setGuestCount(v);
    setGuestNames((prev) => {
      const next = prev.slice(0, v - 1);
      while (next.length < v - 1) next.push("");
      return next;
    });
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) { setStatus("Please enter your full name."); return; }
    if (attending === "yes" && guestNames.some((g) => !g.trim() && guestNames.length > 0)) {
      // if extra guests added but name empty, warn
      if (guestNames.some((g) => !g.trim())) { setStatus("Please fill in all guest names."); return; }
    }
    setConfirmAttending(attending);
    setConfirmed(true);
    setStatus("");
  }

  if (confirmed) {
    if (confirmAttending === "no") {
      return (
        <section className="bloom-rsvp bloom-rsvp--thanks" id="rsvp">
          <div className="section-inner narrow" data-reveal>
            <h2 className="bloom-script">Thank you</h2>
            <p>We&apos;re sorry you can&apos;t make it. We&apos;ll be thinking of you on our special day.</p>
            <p className="bloom-script bloom-rsvp__sig">— Martina &amp; Javier</p>
          </div>
        </section>
      );
    }
    return (
      <section className="bloom-rsvp__confirm-wrap" id="rsvp" aria-live="polite">
        <div className="bloom-rsvp__thanks-stage">
          <h2 className="bloom-script">Thank you for your response!</h2>
          <p>We&apos;re so excited to celebrate with you on the Côte d&apos;Azur.</p>
          <p>Thank you for being part of our story.</p>
          <p className="is-muted">We look forward to seeing you on:</p>
          <p className="bloom-script bloom-rsvp__sig">September 27, 2026 — Hotel du Cap-Eden-Roc</p>
          <p className="bloom-rsvp__note">If your plans change and you can no longer attend, please let us know as soon as possible.</p>
          <p className="bloom-script bloom-rsvp__sig">— Martina &amp; Javier</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bloom-rsvp" id="rsvp" aria-labelledby="rsvp-title">
      {portraitUrl && <img className="bloom-rsvp__portrait" src={portraitUrl} alt="Martina & Javier" loading="lazy" />}
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title" className="bloom-script">{title}</h2>
        <span className="bloom-rule" aria-hidden="true" />
        <p className="bloom-kicker">{subtitle}</p>
        <div className="bloom-rsvp__card">
          {floralTopUrl && <img className="bloom-rsvp__floral bloom-rsvp__floral--top" src={floralTopUrl} alt="" aria-hidden="true" loading="lazy" />}
          {floralBottomUrl && <img className="bloom-rsvp__floral bloom-rsvp__floral--bottom" src={floralBottomUrl} alt="" aria-hidden="true" loading="lazy" />}
          <form className="bloom-rsvp__form" onSubmit={handleSubmit}>
            <label>
              {guestCount > 1 ? `Guest 1 name *` : `Full name *`}
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
            </label>

            <fieldset>
              <legend>Will you be attending? *</legend>
              <label className="bloom-radio"><input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} /> Joyfully accepts</label>
              <label className="bloom-radio"><input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} /> Regretfully declines</label>
            </fieldset>

            {attending === "yes" && (
              <>
                <div className="bloom-rsvp__guests">
                  <label>Number of guests attending *</label>
                  <div className="bloom-rsvp__counter">
                    <button type="button" disabled={guestCount <= 1} onClick={() => updateGuestCount(guestCount - 1)} aria-label="Decrease guests">−</button>
                    <span>{guestCount}</span>
                    <button type="button" disabled={guestCount >= 10} onClick={() => updateGuestCount(guestCount + 1)} aria-label="Increase guests">+</button>
                  </div>
                  {guestNames.map((g, idx) => (
                    <label key={idx}>
                      Guest {idx + 2} name *
                      <input type="text" value={g} onChange={(e) => setGuestNames((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))} placeholder="Enter guest's full name" />
                    </label>
                  ))}
                </div>

                <fieldset>
                  <legend>Transportation *</legend>
                  <label className="bloom-radio"><input type="radio" name="transport" value="shuttle" checked={transport === "shuttle"} onChange={() => setTransport("shuttle")} /> Shuttle Service from Hôtel Belles Rives</label>
                  <label className="bloom-radio"><input type="radio" name="transport" value="valet" checked={transport === "valet"} onChange={() => setTransport("valet")} /> Valet Parking at the venue</label>
                </fieldset>
              </>
            )}

            <label>
              A personal message for the couple
              <textarea rows="4" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share a wish, a memory, or anything you'd like us to read…" maxLength={1000} />
            </label>

            <button type="submit" className="bloom-rsvp__submit"><Send size={16} aria-hidden="true" /> Send RSVP</button>
            {status && <p className="form-status">{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}

function BloomFooter({ names, date, creditLine, creditName, creditUrl, frameUrl }) {
  return (
    <footer className="bloom-footer">
      <div className="bloom-footer__frame" style={frameUrl ? { borderImageSource: `url(${frameUrl})` } : undefined}>
        <p className="bloom-script bloom-footer__names">{names}</p>
        <p className="bloom-kicker bloom-footer__date">{date}</p>
      </div>
      {creditLine && creditName && (
        <p className="bloom-footer__credit">{creditLine} {creditUrl ? <a href={creditUrl} target="_blank" rel="noreferrer">{creditName}</a> : creditName}</p>
      )}
    </footer>
  );
}

const sectionComponents = {
  hero: BloomHero,
  countdown: BloomCountdown,
  welcome: BloomWelcome,
  details: BloomCeremony,
  dressCode: BloomDressCode,
  schedule: BloomProgramme,
  story: BloomStory,
  weddingWeekend: BloomWeekend,
  hotelList: BloomHotels,
  locationTransport: BloomTransport,
  rsvp: BloomRsvp,
  credit: BloomFooter,
};

export function BloomInvitation() {
  const { theme, media, copy, sections } = invitationData;
  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="bloom-shell"
      contentClassName="bloom-content"
    />
  );
}
