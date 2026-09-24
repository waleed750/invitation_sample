import React, { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, MapPin, Calendar, Clock, Music, Bus, Bed } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import "./styles.css";

function DolceHero({ headline, firstName, secondName, displayDate, heroVideoUrl, heroPosterUrl, ctaLabel }) {
  const scrollDown = () => {
    const el = document.getElementById("countdown");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  // hero-video-bg is an ambient loop (frame hashes distinct at 0/48/96/144, 7.04s h264, loop attr in HTML, text is DOM overlay) -> loop:true + overlay:true
  return (
    <section className="dv-hero" aria-labelledby="hero-title">
      <video
        className="dv-hero__video"
        src={heroVideoUrl}
        poster={heroPosterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="dv-hero__overlay">
        <div className="dv-hero__copy" data-reveal>
          {headline && <p className="dv-hero__eyebrow">{headline}</p>}
          {(firstName || secondName) && (
            <h1 id="hero-title" className="dv-hero__names">
              <span className="dv-hero__name">{firstName}</span>
              <span className="dv-hero__amp">&amp;</span>
              <span className="dv-hero__name">{secondName}</span>
            </h1>
          )}
          {displayDate && <p className="dv-hero__date">{displayDate}</p>}
        </div>
        {ctaLabel && (
          <button type="button" className="dv-hero__cue" onClick={scrollDown} aria-label={ctaLabel}>
            <span>{ctaLabel}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

function DolceCountdown({ date, title, kicker, showSeconds, countdownBgUrl }) {
  return (
    <div id="countdown" className="dv-countdown-wrap">
      {countdownBgUrl && (
        <img className="dv-countdown__bg" src={countdownBgUrl} alt="" aria-hidden="true" />
      )}
      <Countdown date={date} title={title} kicker={kicker} showSeconds={showSeconds} />
      <div className="dv-countdown__fade" aria-hidden="true" />
    </div>
  );
}

function DolcePetsDivider({ imageUrl }) {
  if (!imageUrl) return null;
  return (
    <div className="dv-pets" aria-hidden="true">
      <img src={imageUrl} alt="Watercolor pets bouquet" loading="lazy" />
    </div>
  );
}

function DolceLocation({
  title,
  subtitle,
  ceremonyTitle,
  ceremonyName,
  ceremonyTime,
  ceremonyAddress,
  ceremonyImageUrl,
  ceremonyMapSrc,
  ceremonyMapSearchUrl,
  ceremonyCalendarUrl,
  receptionTitle,
  receptionName,
  receptionTime,
  receptionAddress,
  receptionImageUrl,
  receptionMapSrc,
  receptionMapSearchUrl,
  receptionCalendarUrl,
  ribbonUrl,
  ribbonBottomUrl,
  lemonUrl,
  cocktailUrl,
  ringsUrl,
  beachChairUrl,
}) {
  return (
    <section className="dv-location" aria-labelledby="location-title">
      <div className="section-inner" data-reveal>
        {lemonUrl && <img className="dv-location__lemon" src={lemonUrl} alt="" aria-hidden="true" loading="lazy" />}
        <p className="dv-kicker">{subtitle}</p>
        <h2 id="location-title" className="dv-script">{title}</h2>
        <div className="dv-divider-line" aria-hidden="true" />

        {/* Ceremony card */}
        <div className="dv-location__card">
          {ribbonUrl && <img className="dv-location__ribbon" src={ribbonUrl} alt="" aria-hidden="true" loading="lazy" />}
          <div className="dv-location__ribbon-content">
            <p className="dv-location__eyebrow">{ceremonyTitle}</p>
            <h3 className="dv-location__venue">{ceremonyName}</h3>
            <p className="dv-location__time">{ceremonyTime}</p>
          </div>
          {ceremonyImageUrl && (
            <div className="dv-location__photo">
              <img src={ceremonyImageUrl} alt="Chiesa di Santa Maria Maddalena" loading="lazy" />
            </div>
          )}
          <p className="dv-location__address">{ceremonyAddress}</p>
          {ceremonyMapSrc && (
            <div className="dv-location__map">
              <iframe
                title={`Mapa de ${ceremonyName}`}
                src={ceremonyMapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
          <div className="dv-location__actions">
            {ceremonyMapSearchUrl && (
              <a className="dv-btn dv-btn--ghost" href={ceremonyMapSearchUrl} target="_blank" rel="noreferrer">
                <MapPin size={14} aria-hidden="true" /> Open in Maps
              </a>
            )}
            {ceremonyCalendarUrl && (
              <a className="dv-btn dv-btn--ghost" href={ceremonyCalendarUrl} target="_blank" rel="noreferrer">
                <Calendar size={14} aria-hidden="true" /> Add to calendar
              </a>
            )}
          </div>
          {ringsUrl && <img className="dv-location__rings" src={ringsUrl} alt="" aria-hidden="true" loading="lazy" />}
        </div>

        {/* Reception card */}
        <div className="dv-location__card dv-location__card--reception">
          <div className="dv-location__card-head">
            {cocktailUrl && <img className="dv-location__cocktail" src={cocktailUrl} alt="" aria-hidden="true" loading="lazy" />}
            <p className="dv-location__eyebrow">{receptionTitle}</p>
            <h3 className="dv-location__venue">{receptionName}</h3>
            <p className="dv-location__time">{receptionTime}</p>
          </div>
          {receptionImageUrl && (
            <div className="dv-location__photo">
              <img src={receptionImageUrl} alt="Villa del Balbianello" loading="lazy" />
            </div>
          )}
          <div className="dv-location__ribbon-bottom-wrap">
            {ribbonBottomUrl && <img className="dv-location__ribbon-bottom" src={ribbonBottomUrl} alt="" aria-hidden="true" loading="lazy" />}
            <div className="dv-location__ribbon-overlay">
              <p className="dv-location__address dv-location__address--on-ribbon">{receptionAddress}</p>
              <div className="dv-location__actions">
                {receptionMapSearchUrl && (
                  <a className="dv-btn dv-btn--ghost dv-btn--light" href={receptionMapSearchUrl} target="_blank" rel="noreferrer">
                    <MapPin size={14} aria-hidden="true" /> Open in Maps
                  </a>
                )}
                {receptionCalendarUrl && (
                  <a className="dv-btn dv-btn--ghost dv-btn--light" href={receptionCalendarUrl} target="_blank" rel="noreferrer">
                    <Calendar size={14} aria-hidden="true" /> Add to calendar
                  </a>
                )}
              </div>
            </div>
          </div>
          {beachChairUrl && <img className="dv-location__beach" src={beachChairUrl} alt="" aria-hidden="true" loading="lazy" />}
        </div>
      </div>
    </section>
  );
}

function DolceSchedule({ title, subtitle, imageUrl, floatyRingUrl }) {
  return (
    <section className="dv-schedule" aria-labelledby="schedule-title">
      <div className="section-inner" data-reveal>
        {floatyRingUrl && <img className="dv-schedule__floaty" src={floatyRingUrl} alt="" aria-hidden="true" loading="lazy" />}
        {subtitle && <p className="dv-kicker">{subtitle}</p>}
        <h2 id="schedule-title" className="dv-script">{title}</h2>
        <div className="dv-divider-line" aria-hidden="true" />
        {imageUrl && (
          <div className="dv-schedule__image">
            <img src={imageUrl} alt="Schedule of the day: Ceremony 14:00, Transportation 14:45, Arrival 16:00, Dinner 17:00, Cake 19:30, First Dance 20:00, Party 20:30, Farewells 01:00" loading="lazy" />
          </div>
        )}
      </div>
    </section>
  );
}

function DolceDressCode({ title, subtitle, illustrationUrl, fanUrl, parasolUrl, items = [] }) {
  return (
    <section className="dv-dresscode" aria-labelledby="dresscode-title">
      <div className="section-inner narrow" data-reveal>
        {fanUrl && <img className="dv-dresscode__fan" src={fanUrl} alt="" aria-hidden="true" loading="lazy" />}
        {parasolUrl && <img className="dv-dresscode__parasol" src={parasolUrl} alt="" aria-hidden="true" loading="lazy" />}
        {subtitle && <p className="dv-kicker">{subtitle}</p>}
        <h2 id="dresscode-title" className="dv-script">{title}</h2>
        <div className="dv-divider-line" aria-hidden="true" />
        {illustrationUrl && (
          <div className="dv-dresscode__illustration">
            <img src={illustrationUrl} alt="Elegant wedding guests" loading="lazy" />
          </div>
        )}
        <div className="dv-dresscode__list">
          {items.map((it) => (
            <div key={it.label} className="dv-dresscode__item">
              <p className="dv-dresscode__label">{it.label}</p>
              <p className="dv-dresscode__body">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DolceAccommodation({ title, subtitle, body, illustrationUrl, saxUrl, violinUrl, hotels = [] }) {
  return (
    <section className="dv-accommodation" aria-labelledby="accommodation-title">
      <div className="section-inner narrow" data-reveal>
        {saxUrl && <img className="dv-accommodation__sax" src={saxUrl} alt="" aria-hidden="true" loading="lazy" />}
        {violinUrl && <img className="dv-accommodation__violin" src={violinUrl} alt="" aria-hidden="true" loading="lazy" />}
        {subtitle && <p className="dv-kicker">{subtitle}</p>}
        <h2 id="accommodation-title" className="dv-script">{title}</h2>
        <div className="dv-divider-line" aria-hidden="true" />
        {illustrationUrl && (
          <div className="dv-accommodation__illus">
            <img src={illustrationUrl} alt="Watercolor manor house" loading="lazy" />
          </div>
        )}
        {body && <p className="dv-accommodation__body">{body}</p>}
        {hotels.map((h) => (
          <div key={h.name} className="dv-accommodation__card">
            <p className="dv-accommodation__label">Hotel</p>
            <a className="dv-accommodation__hotel-link" href={h.link} target="_blank" rel="noreferrer">{h.name}</a>
            <p className="dv-accommodation__label" style={{ marginTop: "0.75rem" }}>{h.priceNote}</p>
            <p className="dv-accommodation__price">{h.pricePerNight}</p>
            <p className="dv-accommodation__label" style={{ marginTop: "0.75rem" }}>How to book</p>
            <p className="dv-accommodation__booking">{h.bookingNote}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DolceTransport({ title, subtitle, body, busUrl, birdsUrl, boatDeparture, returnOptions = [], note1, note2 }) {
  return (
    <section className="dv-transport" aria-labelledby="transport-title">
      <div className="section-inner narrow" data-reveal>
        {birdsUrl && (
          <div className="dv-transport__birds">
            <img src={birdsUrl} alt="" aria-hidden="true" loading="lazy" />
          </div>
        )}
        {subtitle && <p className="dv-kicker">{subtitle}</p>}
        <h2 id="transport-title" className="dv-script">{title}</h2>
        <div className="dv-divider-line" aria-hidden="true" />
        {busUrl && (
          <div className="dv-transport__bus">
            <img src={busUrl} alt="Private boat transport" loading="lazy" />
          </div>
        )}
        {body && <p className="dv-transport__body">{body}</p>}
        <div className="dv-transport__details">
          <div className="dv-transport__row">
            <p className="dv-transport__label">Boat departure</p>
            <p className="dv-transport__value">{boatDeparture}</p>
          </div>
          <div className="dv-transport__row">
            <p className="dv-transport__label">Return to Tremezzo / Bellagio, two choices:</p>
            <ul className="dv-transport__list">
              {returnOptions.map((opt) => (
                <li key={opt}>{opt}</li>
              ))}
            </ul>
          </div>
          <div className="dv-transport__row dv-transport__notes">
            <p>{note1}</p>
            <p>{note2}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DolceGifts({ title, subtitle, body, thanks, globeUrl, balloonsUrl, wildflowerUrl, options = [] }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="dv-gifts" aria-labelledby="gifts-title">
      <div className="section-inner narrow" data-reveal>
        {balloonsUrl && <img className="dv-gifts__balloons" src={balloonsUrl} alt="" aria-hidden="true" loading="lazy" />}
        {wildflowerUrl && <img className="dv-gifts__wildflower" src={wildflowerUrl} alt="" aria-hidden="true" loading="lazy" />}
        {subtitle && <p className="dv-kicker">{subtitle}</p>}
        <h2 id="gifts-title" className="dv-script">{title}</h2>
        {globeUrl && (
          <div className="dv-gifts__globe">
            <img src={globeUrl} alt="" aria-hidden="true" loading="lazy" />
          </div>
        )}
        <div className="dv-divider-line" aria-hidden="true" />
        <p className="dv-gifts__body">{body}</p>
        <p className="dv-gifts__body">{thanks}</p>
        <div className="dv-gifts__accordions">
          {options.map((opt) => (
            <div key={opt} className="dv-gifts__accordion">
              <button
                type="button"
                className="dv-gifts__trigger"
                aria-expanded={open === opt}
                onClick={() => setOpen(open === opt ? null : opt)}
              >
                <span>{opt}</span>
                <ChevronDown size={16} className={open === opt ? "is-open" : ""} aria-hidden="true" />
              </button>
              {open === opt && (
                <div className="dv-gifts__panel">
                  <p className="dv-gifts__note">Details for {opt} will be shared closer to the date. Please contact the couple for more information.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DolceRsvp({ title, subtitle, ribbonUrl, ribbonBottomUrl, swansUrl, rsvpConfirmationVideoUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState("yes");
  const [fullName, setFullName] = useState("");
  const [dinner, setDinner] = useState("fish");
  const [diet, setDiet] = useState("");
  const [phone, setPhone] = useState("");
  const [transport, setTransport] = useState([]);
  const [accommodation, setAccommodation] = useState(false);
  const [song, setSong] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmAttending, setConfirmAttending] = useState("yes");
  const videoRef = useRef(null);
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    if (!confirmed) return;
    if (confirmAttending === "no") {
      setShowThanks(true);
      return;
    }
    const v = videoRef.current;
    if (!v) {
      setShowThanks(true);
      return;
    }
    const onTimeUpdate = () => {
      if (v.duration - v.currentTime <= 1.2 && !showThanks) setShowThanks(true);
    };
    const onEnded = () => setShowThanks(true);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, [confirmed, confirmAttending, showThanks]);

  function toggleTransport(id) {
    setTransport((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatus("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setStatus("Please enter your contact phone.");
      return;
    }
    setConfirmAttending(attending);
    setConfirmed(true);
    setShowThanks(attending === "no");
    setStatus("");
  }

  if (confirmed) {
    if (confirmAttending === "no") {
      return (
        <section className="dv-rsvp dv-rsvp--thanks" id="rsvp">
          <div className="section-inner narrow" data-reveal>
            <h2 className="dv-script">Gracias</h2>
            <p className="dv-rsvp__thanks">Thank you for letting us know. We will miss you on this special day — you will be in our hearts.</p>
            <p className="dv-script dv-rsvp__sig">— Marco &amp; Sofia</p>
          </div>
        </section>
      );
    }
    return (
      <section className="dv-rsvp__confirm-wrap" id="rsvp" aria-live="polite">
        {!showThanks && rsvpConfirmationVideoUrl ? (
          <div className="dv-rsvp__video-stage">
            <video
              ref={videoRef}
              src={rsvpConfirmationVideoUrl}
              autoPlay
              muted
              playsInline
              className="dv-rsvp__video"
            />
            <div className={`dv-rsvp__video-fade ${showThanks ? "is-visible" : ""}`} aria-hidden="true" />
          </div>
        ) : (
          <div className="dv-rsvp__thanks-stage">
            <h2 className="dv-script dv-rsvp__thanks-title">Thank you for your RSVP</h2>
            <div className="dv-rsvp__thanks-body">
              <p>We are so happy you will celebrate with us by Lake Como.</p>
              <p>Thank you for being part of this new chapter of our lives.</p>
              <p className="dv-rsvp__thanks-venue">We will see you on September 12 at Villa del Balbianello.</p>
            </div>
            <p className="dv-script dv-rsvp__sig">— Marco &amp; Sofia</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="dv-rsvp" id="rsvp" aria-labelledby="rsvp-title">
      {ribbonUrl && (
        <div className="dv-rsvp__ribbon-top" aria-hidden="true">
          <img src={ribbonUrl} alt="" loading="lazy" />
        </div>
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title" className="dv-script">{title}</h2>
        {swansUrl && (
          <div className="dv-rsvp__swans">
            <img src={swansUrl} alt="" aria-hidden="true" loading="lazy" />
          </div>
        )}
        {subtitle && <p className="dv-rsvp__subtitle">{subtitle}</p>}
        <form className="dv-rsvp__form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Will you attend? *</legend>
            <label className="dv-radio">
              <input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} />
              Yes, I&apos;ll be there
            </label>
            <label className="dv-radio">
              <input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} />
              Sorry, I can&apos;t make it
            </label>
          </fieldset>

          <label>
            Full name *
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </label>

          {attending === "yes" && (
            <fieldset>
              <legend>Dinner choice (choose one) *</legend>
              <label className="dv-radio">
                <input type="radio" name="dinner" value="fish" checked={dinner === "fish"} onChange={() => setDinner("fish")} />
                Sea bass
              </label>
              <label className="dv-radio">
                <input type="radio" name="dinner" value="vegetarian" checked={dinner === "vegetarian"} onChange={() => setDinner("vegetarian")} />
                Vegetarian
              </label>
            </fieldset>
          )}

          <label>
            Allergies or dietary requirements
            <input type="text" value={diet} onChange={(e) => setDiet(e.target.value)} placeholder="e.g. gluten-free, lactose intolerant…" />
          </label>

          <label>
            Contact phone *
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 333 000 0000" />
          </label>

          {attending === "yes" && (
            <>
              <div className="dv-rsvp__group">
                <p className="dv-rsvp__label">Transportation (indicate all time slots that apply)</p>
                <label className="dv-checkbox">
                  <input type="checkbox" checked={transport.includes("17:15")} onChange={() => toggleTransport("17:15")} />
                  17:15 boat to Villa del Balbianello
                </label>
                <label className="dv-checkbox">
                  <input type="checkbox" checked={transport.includes("23:00")} onChange={() => toggleTransport("23:00")} />
                  23:00 boat back to Tremezzo
                </label>
                <label className="dv-checkbox">
                  <input type="checkbox" checked={transport.includes("01:30")} onChange={() => toggleTransport("01:30")} />
                  01:30 boat back to Tremezzo
                </label>
              </div>

              <div className="dv-rsvp__group">
                <p className="dv-rsvp__label">Accommodation</p>
                <label className="dv-checkbox">
                  <input type="checkbox" checked={accommodation} onChange={(e) => setAccommodation(e.target.checked)} />
                  If you would like us to reserve a room for you (€420 per room), indicate here.
                </label>
              </div>
            </>
          )}

          <label>
            <span className="dv-rsvp__label-icon">
              <Music size={14} aria-hidden="true" /> Song you&apos;d love to hear
            </span>
            <input type="text" value={song} onChange={(e) => setSong(e.target.value)} placeholder="e.g. Viva la Vida - Coldplay" />
          </label>

          <label>
            Message for the couple (optional)
            <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write us a few words…" />
          </label>

          <button type="submit" className="dv-rsvp__submit">
            <Send size={16} aria-hidden="true" /> Send RSVP
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
      {ribbonBottomUrl && (
        <div className="dv-rsvp__ribbon-bottom" aria-hidden="true">
          <img src={ribbonBottomUrl} alt="" loading="lazy" />
        </div>
      )}
    </section>
  );
}

function DolceDivider() {
  return (
    <div className="dv-divider" aria-hidden="true">
      <span className="dv-divider__line" />
      <span className="dv-divider__dot">✦</span>
      <span className="dv-divider__line" />
    </div>
  );
}

function DolceFooter({ names, date, loveLine, creditLine, creditName, creditUrl, kissUrl, footerManorUrl }) {
  return (
    <footer className="dv-footer">
      {kissUrl && (
        <div className="dv-footer__kiss">
          <img src={kissUrl} alt="" loading="lazy" />
        </div>
      )}
      {loveLine && <p className="dv-footer__love dv-script">{loveLine}</p>}
      <div className="dv-footer__manor-wrap">
        {footerManorUrl && <img className="dv-footer__manor" src={footerManorUrl} alt="Watercolor manor house" loading="lazy" />}
        <div className="dv-footer__manor-overlay">
          <p className="dv-script dv-footer__names">{names}</p>
          <span className="dv-footer__sep" aria-hidden="true" />
          <p className="dv-footer__date">{date}</p>
        </div>
      </div>
      {creditLine && creditName && (
        <p className="dv-footer__credit">
          {creditLine}{" "}
          {creditUrl ? (
            <a href={creditUrl} target="_blank" rel="noreferrer">{creditName}</a>
          ) : (
            creditName
          )}
        </p>
      )}
    </footer>
  );
}

const sectionComponents = {
  hero: DolceHero,
  countdown: DolceCountdown,
  details: DolceLocation,
  schedule: DolceSchedule,
  dressCode: DolceDressCode,
  hotelList: DolceAccommodation,
  locationTransport: DolceTransport,
  gifts: DolceGifts,
  rsvp: DolceRsvp,
  credit: DolceFooter,
  imageDivider: DolcePetsDivider,
};

export function DolceVitaInvitation() {
  const { theme, media, copy, sections } = invitationData;
  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="dv-shell"
      contentClassName="dv-content"
    />
  );
}
