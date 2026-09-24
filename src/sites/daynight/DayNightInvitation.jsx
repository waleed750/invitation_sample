import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, ChevronDown, MapPin, Calendar, Clock, Bed, Music, Sun, Moon } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import "./styles.css";

// Hero: one-shot day→night scrub (3.04s h264, distinct hashes at 0/1/2s,
// loop attr absent, text is DOM overlay not baked). After first play,
// isDark=true and toggle scrubs forward/backward via raf currentTime±0.05.
function DayNightHero({ headline, firstName, secondName, displayDate, heroVideoUrl, heroPosterUrl }) {
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const scrollToCountdown = () => {
    const el = document.getElementById("countdown");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const onEnded = useCallback(() => {
    setIsDark(true);
    setHasPlayed(true);
  }, []);

  const scrubForward = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    v.play().catch(() => {});
    setIsDark(true);
  }, []);

  const scrubBackward = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    const tick = () => {
      if (!v) return;
      const next = v.currentTime - 0.05;
      if (next <= 0.05) {
        v.currentTime = 0;
        setIsDark(false);
        rafRef.current = null;
        return;
      }
      v.currentTime = next;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const toggle = useCallback(() => {
    if (isDark) scrubBackward();
    else scrubForward();
  }, [isDark, scrubBackward, scrubForward]);

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  // hero-video is one-shot card with DOM overlay text → loop false, overlay stays visible,
  // but color switches day/night (white vs foreground) per isDark.
  return (
    <section className={`dn-hero ${isDark ? "is-dark" : "is-light"}`} aria-labelledby="hero-title">
      <div className="dn-hero__media">
        {heroVideoUrl && (
          <video
            ref={videoRef}
            className="dn-hero__video"
            src={heroVideoUrl}
            poster={heroPosterUrl}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onEnded={onEnded}
          />
        )}
      </div>
      <div className="dn-hero__copy" data-reveal>
        {headline && <p className={`dn-hero__eyebrow ${isDark ? "text-white" : "text-foreground"}`}>{headline}</p>}
        {(firstName || secondName) && (
          <h1 id="hero-title" className={`dn-hero__names ${isDark ? "text-white" : "text-foreground"}`}>
            <span className="dn-hero__name">{firstName}</span>
            <span className="dn-hero__amp">&amp;</span>
            <span className="dn-hero__name">{secondName}</span>
          </h1>
        )}
        {displayDate && <p className={`dn-hero__date ${isDark ? "text-white-70" : "text-foreground-70"}`}>{displayDate}</p>}
      </div>
      {hasPlayed && (
        <button
          type="button"
          className={`dn-hero__toggle ${isDark ? "is-dark" : "is-light"}`}
          aria-label={isDark ? "Switch to day" : "Switch to night"}
          onClick={toggle}
        >
          <span className="dn-hero__toggle-track">
            <span className="dn-hero__toggle-thumb">
              {isDark ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
            </span>
          </span>
          <span className="dn-hero__toggle-icons" aria-hidden="true">
            <Sun size={14} className={isDark ? "opacity-40" : "opacity-0"} />
            <Moon size={14} className={isDark ? "opacity-0" : "opacity-40"} />
          </span>
        </button>
      )}
      <button type="button" className="dn-hero__cue" onClick={scrollToCountdown} aria-label="Scroll to details">
        <ChevronDown size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

function DayNightCountdown({ date, title, kicker, showSeconds, monogramUrl }) {
  return (
    <div className="dn-countdown-wrap" id="countdown">
      {monogramUrl && <img className="dn-countdown__monogram" src={monogramUrl} alt="Monogram" loading="lazy" />}
      <Countdown date={date} title={title} kicker={kicker} showSeconds={showSeconds} />
    </div>
  );
}

function DayNightDetails({ title, subtitle, venue, startTime, endTime, mapSrc, mapSearchUrl, calendarUrl, venueImageUrl, frameUrl, dogBouquetUrl }) {
  // Build ics download helper like source jF
  const downloadIcs = () => {
    const blob = new Blob(
      [
        ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TheDigitalYes//Wedding//EN", "BEGIN:VEVENT", `DTSTART;TZID=Europe/Rome:20270918T170000`, `DTEND;TZID=Europe/Rome:20270919T020000`, `SUMMARY:Boda Lucía & Felipe`, `LOCATION:${venue}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n"),
      ],
      { type: "text/calendar;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding.ics";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="dn-details" aria-labelledby="details-title">
      <div className="section-inner" data-reveal>
        {dogBouquetUrl && <img className="dn-details__dog" src={dogBouquetUrl} alt="Dog bouquet" loading="lazy" />}
        <h2 id="details-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-details__subtitle">{subtitle}</p>}
        <div className="dn-details__card-wrap">
          <div className="dn-details__card">
            {frameUrl && <img className="dn-details__frame" src={frameUrl} alt="" aria-hidden="true" />}
            <div className="dn-details__card-inner">
              <h3 className="dn-script dn-details__venue-title">Location</h3>
              <p className="dn-details__venue">{venue}</p>
              <p className="dn-details__time"><Clock size={14} aria-hidden="true" /> From {startTime} to {endTime}</p>
              {venueImageUrl && (
                <div className="dn-details__photo">
                  <img src={venueImageUrl} alt="Villa Montalcino" loading="lazy" />
                </div>
              )}
            </div>
          </div>
          <div className="dn-details__actions">
            {mapSearchUrl && (
              <a className="dn-btn dn-btn--dark" href={mapSearchUrl} target="_blank" rel="noreferrer"><MapPin size={14} aria-hidden="true" /> Google Maps</a>
            )}
            <button type="button" className="dn-btn dn-btn--dark" onClick={downloadIcs}><Calendar size={14} aria-hidden="true" /> Calendar</button>
          </div>
        </div>
        {mapSrc && (
          <div className="dn-details__map" style={{ display: "none" }}>
            <iframe title={`Mapa de ${venue}`} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
        )}
      </div>
    </section>
  );
}

function DayNightSchedule({ title, subtitle, coupleDancingUrl, venueEntranceUrl, items = [] }) {
  return (
    <section className="dn-schedule" aria-labelledby="schedule-title">
      {coupleDancingUrl && <img className="dn-schedule__dancing" src={coupleDancingUrl} alt="Couple dancing" loading="lazy" />}
      <div className="section-inner" data-reveal>
        <h2 id="schedule-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-schedule__subtitle">{subtitle}</p>}
      </div>
      <div className="dn-schedule__venue-wrap">
        {venueEntranceUrl && <img className="dn-schedule__venue-img" src={venueEntranceUrl} alt="Venue entrance" loading="lazy" />}
        <div className="dn-schedule__overlay">
          <div className="dn-schedule__list">
            {items.map((it, idx) => (
              <div key={it.title} className="dn-schedule__item">
                {idx > 0 && <div className="dn-schedule__connector" aria-hidden="true" />}
                <div className="dn-schedule__item-copy">
                  {it.time && <p className="dn-schedule__time">{it.time}</p>}
                  <h3>{it.title}</h3>
                  {it.description && <p className="dn-schedule__desc">{it.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DayNightDressCode({ title, subtitle, illustrationUrl, items = [] }) {
  return (
    <section className="dn-dresscode" aria-labelledby="dresscode-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="dresscode-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-dresscode__subtitle">{subtitle}</p>}
        {illustrationUrl && (
          <div className="dn-dresscode__illus">
            <img src={illustrationUrl} alt="Elegant guests" loading="lazy" />
          </div>
        )}
        <div className="dn-dresscode__card">
          {items.map((it, idx) => (
            <div key={idx} className="dn-dresscode__block">
              {it.label && <h3>{it.label}</h3>}
              <p className={idx > 0 ? "is-italic" : ""}>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DayNightHotels({ title, subtitle, body, body2, illustrationUrl, hotels = [], quickTips = [] }) {
  return (
    <section className="dn-hotels" aria-labelledby="hotels-title">
      <div className="section-inner" data-reveal>
        {illustrationUrl && <img className="dn-hotels__icon" src={illustrationUrl} alt="Accommodation" loading="lazy" />}
        <h2 id="hotels-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-hotels__subtitle">{subtitle}</p>}
        {body && <p className="dn-hotels__body">{body}</p>}
        {body2 && <p className="dn-hotels__body">{body2}</p>}
        <div className="dn-hotels__grid">
          {hotels.map((h) => (
            <article key={h.name} className="dn-hotel-card">
              <p className="dn-hotel__option">{h.name === "Hotel Borgo Antico" ? "Option A" : "Option B"}</p>
              <h3>{h.name}</h3>
              {h.location && <p className="dn-hotel__location"><MapPin size={12} aria-hidden="true" /> {h.location}</p>}
              {h.type && <p className="dn-hotel__type">{h.type}</p>}
              {h.badge && <span className="dn-hotel__badge"><Clock size={12} aria-hidden="true" /> {h.badge}</span>}
              {h.pricePerNight && <span className="dn-hotel__price">{h.pricePerNight}</span>}
              {h.discount && <p className="dn-hotel__discount"><strong>15% discount</strong> using the code <code>LuciaFelipe</code></p>}
              {h.priceNote && <p className="dn-hotel__note">{h.priceNote}</p>}
              {h.tip && <p className="dn-hotel__tip">{h.tip}</p>}
              {h.warning && <p className="dn-hotel__warning">{h.warning}</p>}
              {h.warningNote && <p className="dn-hotel__tip">{h.warningNote}</p>}
              {h.link && (
                <a className="dn-btn dn-btn--outline" href={h.link} target="_blank" rel="noreferrer">View hotel</a>
              )}
            </article>
          ))}
        </div>
        {quickTips.length > 0 && (
          <div className="dn-hotels__tips">
            <h3>Quick Tips</h3>
            <div className="dn-hotels__tips-card">
              {quickTips.map((t) => (
                <p key={t}>• {t}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DayNightTransport({ title, subtitle, body, body2, busUrl, note }) {
  return (
    <section className="dn-transport" aria-labelledby="transport-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="transport-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-transport__subtitle">{subtitle}</p>}
        {body && <p className="dn-transport__body">{body}</p>}
        {body2 && <p className="dn-transport__body">{body2}</p>}
        {busUrl && <img className="dn-transport__bus" src={busUrl} alt="Bus" loading="lazy" />}
        {note && <p className="dn-transport__note">{note}</p>}
      </div>
    </section>
  );
}

function DayNightGifts({ title, subtitle, body, flowerBouquetUrl, options = [] }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="dn-gifts" aria-labelledby="gifts-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-gifts__subtitle">{subtitle}</p>}
        <div className="dn-gifts__card-wrap">
          <div className="dn-gifts__card">
            <p className="dn-gifts__body">{body}</p>
            <div className="dn-gifts__accordions">
              {options.map((opt) => (
                <div key={opt} className="dn-gifts__accordion">
                  <button type="button" className="dn-gifts__trigger" aria-expanded={open === opt} onClick={() => setOpen(open === opt ? null : opt)}>
                    <span>{opt}</span>
                    <ChevronDown size={16} className={open === opt ? "is-open" : ""} aria-hidden="true" />
                  </button>
                  {open === opt && <div className="dn-gifts__panel"><p className="dn-gifts__note">Details for {opt} will be shared closer to the date. Please contact the couple for more information.</p></div>}
                </div>
              ))}
            </div>
          </div>
          {flowerBouquetUrl && <img className="dn-gifts__bouquet" src={flowerBouquetUrl} alt="Flower bouquet" loading="lazy" />}
        </div>
      </div>
    </section>
  );
}

function DayNightPhotoDivider({ imageUrl }) {
  if (!imageUrl) return null;
  return (
    <div className="dn-photo-divider" aria-hidden="true">
      <img src={imageUrl} alt="Lucía y Felipe" loading="lazy" />
    </div>
  );
}

function DayNightRsvp({ title, subtitle, rsvpConfirmationVideoUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState("yes");
  const [fullName, setFullName] = useState("");
  const [allergies, setAllergies] = useState("");
  const [phone, setPhone] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [song, setSong] = useState("");
  const [message, setMessage] = useState("");
  const [transport, setTransport] = useState(false);
  const [companions, setCompanions] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!confirmed) return;
    if (attending === "no") { setShowThanks(true); return; }
    const v = videoRef.current;
    if (!v) { setShowThanks(true); return; }
    const onTimeUpdate = () => { if (v.duration - v.currentTime <= 1.2 && !showThanks) setShowThanks(true); };
    const onEnded = () => setShowThanks(true);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    return () => { v.removeEventListener("timeupdate", onTimeUpdate); v.removeEventListener("ended", onEnded); };
  }, [confirmed, attending, showThanks]);

  function addCompanion(type) {
    setCompanions((prev) => [...prev, { type, name: "", allergies: "" }]);
  }
  function updateCompanion(idx, field, value) {
    setCompanions((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }
  function removeCompanion(idx) {
    setCompanions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) { setStatus("Please enter your full name."); return; }
    if (attending === "yes" && !phone.trim()) { setStatus("Please enter your contact phone."); return; }
    if (attending === "yes" && companions.some((c) => !c.name.trim())) { setStatus("Please fill in all companion names."); return; }
    setConfirmed(true);
    setShowThanks(attending === "no");
    setStatus("");
  }

  if (confirmed) {
    if (attending === "no") {
      return (
        <section className="dn-rsvp dn-rsvp--thanks" id="rsvp">
          <div className="section-inner narrow" data-reveal>
            <h2 className="dn-script">Gracias</h2>
            <p className="dn-rsvp__thanks">Thank you for letting us know. We will miss you on this special day — you will be in our hearts.</p>
            <p className="dn-script dn-rsvp__sig">— Lucía &amp; Felipe</p>
          </div>
        </section>
      );
    }
    return (
      <section className="dn-rsvp__confirm-wrap" id="rsvp" aria-live="polite">
        {!showThanks && rsvpConfirmationVideoUrl ? (
          <div className="dn-rsvp__video-stage">
            <video ref={videoRef} src={rsvpConfirmationVideoUrl} autoPlay muted playsInline className="dn-rsvp__video" />
            <div className={`dn-rsvp__video-fade ${showThanks ? "is-visible" : ""}`} aria-hidden="true" />
          </div>
        ) : (
          <div className="dn-rsvp__thanks-stage">
            <h2 className="dn-script">Thank you for your RSVP</h2>
            <div className="dn-rsvp__thanks-body">
              <p>We are so happy you will celebrate with us.</p>
              <p>We will see you on September 18 at Villa Montalcino.</p>
            </div>
            <p className="dn-script dn-rsvp__sig">— Lucía &amp; Felipe</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="dn-rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title" className="dn-script">{title}</h2>
        {subtitle && <p className="dn-rsvp__subtitle">{subtitle}</p>}
        <form className="dn-rsvp__form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Will you attend? *</legend>
            <label className="dn-radio"><input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} /> Yes, I&apos;ll be there</label>
            <label className="dn-radio"><input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} /> Sorry, I can&apos;t make it</label>
          </fieldset>

          <label>Full name *<input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></label>

          {attending === "yes" && (
            <>
              <label>Allergies or dietary requirements<input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. gluten-free..." /></label>
              <label>Contact phone *<input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" /></label>

              <div className="dn-rsvp__group">
                <p className="dn-rsvp__label">Companions</p>
                <p className="dn-rsvp__help">Add the people joining you and note any allergies they may have.</p>
                <div className="dn-rsvp__comp-actions">
                  <button type="button" className="dn-btn dn-btn--ghost" onClick={() => addCompanion("adult")}>+ Adult</button>
                  <button type="button" className="dn-btn dn-btn--ghost" onClick={() => addCompanion("child")}>+ Child</button>
                </div>
                {companions.map((c, idx) => (
                  <div key={idx} className="dn-rsvp__companion">
                    <span className="dn-rsvp__comp-type">{c.type}</span>
                    <input type="text" value={c.name} onChange={(e) => updateCompanion(idx, "name", e.target.value)} placeholder={`Name (${c.type})`} />
                    <input type="text" value={c.allergies} onChange={(e) => updateCompanion(idx, "allergies", e.target.value)} placeholder="Allergies" />
                    <button type="button" className="dn-rsvp__remove" onClick={() => removeCompanion(idx)} aria-label="Remove companion">×</button>
                  </div>
                ))}
              </div>

              <label className="dn-checkbox"><input type="checkbox" checked={transport} onChange={(e) => setTransport(e.target.checked)} /> I need transport to the venue</label>

              <label>Hotel / Accommodation / Area<input type="text" value={accommodation} onChange={(e) => setAccommodation(e.target.value)} placeholder="e.g. Hotel Borgo Antico..." /></label>
            </>
          )}

          <label><span className="dn-rsvp__label-icon"><Music size={14} aria-hidden="true" /> Song you&apos;d love to hear</span><input type="text" value={song} onChange={(e) => setSong(e.target.value)} placeholder="e.g. Viva la Vida - Coldplay" /></label>

          <label>Message for the couple (optional)<textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write us a few words..." /></label>

          <button type="submit" className="dn-rsvp__submit"><Send size={16} aria-hidden="true" /> Send RSVP</button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function DayNightFooter({ names, date, creditLine, creditName, creditUrl, ringsUrl, footerBgUrl }) {
  return (
    <div className="dn-footer-wrap">
      <footer className="dn-footer" style={footerBgUrl ? { backgroundImage: `url(${footerBgUrl})` } : undefined}>
        <div className="dn-footer__top">
          {ringsUrl && <img className="dn-footer__rings" src={ringsUrl} alt="Rings" loading="lazy" />}
          <p className="dn-script dn-footer__names">{names}</p>
          <p className="dn-footer__date">{date}</p>
        </div>
      </footer>
      <div className="dn-footer__credit">
        <p>{creditLine} <a href={creditUrl} target="_blank" rel="noreferrer">{creditName}</a></p>
      </div>
    </div>
  );
}

const sectionComponents = {
  hero: DayNightHero,
  countdown: DayNightCountdown,
  details: DayNightDetails,
  schedule: DayNightSchedule,
  dressCode: DayNightDressCode,
  hotelList: DayNightHotels,
  locationTransport: DayNightTransport,
  gifts: DayNightGifts,
  rsvp: DayNightRsvp,
  credit: DayNightFooter,
  imageDivider: DayNightPhotoDivider,
};

export function DayNightInvitation() {
  const { theme, media, copy, sections } = invitationData;
  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="dn-shell"
      contentClassName="dn-content"
    />
  );
}
