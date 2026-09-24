import React, { useRef, useState, useEffect } from "react";
import { Send, ChevronDown, Heart, Wine, UtensilsCrossed, Music, PartyPopper, Church, GlassWater, MapPin, Calendar, Clock } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import "./styles.css";

function SweetloveHero({ headline, firstName, secondName, displayDate, heroVideoUrl, heroPosterUrl, ctaLabel }) {
  const scrollToRsvp = () => {
    const el = document.getElementById("rsvp");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  // hero-video-new is an ambient loop (frame hashes distinct at 0/2/5/9s, 10.04s h264, loop attr in HTML), text is DOM overlay -> loop:true + overlay:true
  return (
    <section className="sw-hero" aria-labelledby="hero-title">
      <video
        className="sw-hero__video"
        src={heroVideoUrl}
        poster={heroPosterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="sw-hero__overlay">
        <div className="sw-hero__copy" data-reveal>
          {headline && <p className="sw-hero__eyebrow">{headline}</p>}
          {(firstName || secondName) && (
            <h1 id="hero-title" className="sw-hero__names">
              <span className="sw-hero__name">{firstName}</span>
              <span className="sw-hero__amp">&amp;</span>
              <span className="sw-hero__name">{secondName}</span>
            </h1>
          )}
          {displayDate && <p className="sw-hero__date">{displayDate}</p>}
        </div>
        {ctaLabel && (
          <button type="button" className="sw-hero__cue" onClick={scrollToRsvp} aria-label={ctaLabel}>
            <span>{ctaLabel}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

function SweetloveVenue({ title, subtitle, venue, address, startTime, endTime, mapSrc, mapSearchUrl, calendarUrl }) {
  return (
    <section className="sw-venue" aria-labelledby="venue-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="venue-title" className="sw-script">{title}</h2>
        {subtitle && <p className="sw-venue__subtitle">{subtitle}</p>}
        <div className="sw-venue__card">
          <div className="sw-venue__icon">
            <MapPin size={20} aria-hidden="true" />
          </div>
          <h3 className="sw-venue__venue-name">{venue}</h3>
          {address && <p className="sw-venue__address">{address}</p>}
          {(startTime || endTime) && (
            <p className="sw-venue__time">
              <Clock size={14} aria-hidden="true" />
              De {startTime} a {endTime}
            </p>
          )}
          {mapSrc && (
            <div className="sw-venue__map">
              <iframe
                title={`Mapa de ${venue}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
          <div className="sw-venue__actions">
            {mapSearchUrl && (
              <a className="sw-btn sw-btn--outline" href={mapSearchUrl} target="_blank" rel="noreferrer">
                <MapPin size={14} aria-hidden="true" />
                Abrir en Maps
              </a>
            )}
            {calendarUrl && (
              <a className="sw-btn sw-btn--outline" href={calendarUrl} target="_blank" rel="noreferrer">
                <Calendar size={14} aria-hidden="true" />
                Añadir al calendario
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const scheduleIcons = [Wine, Church, GlassWater, UtensilsCrossed, Heart, PartyPopper, Music];

function SweetloveSchedule({ title, subtitle, items = [] }) {
  return (
    <section className="sw-schedule" aria-labelledby="schedule-title">
      <div className="section-inner" data-reveal>
        <h2 id="schedule-title" className="sw-script">{title}</h2>
        {subtitle && <p className="sw-schedule__subtitle">{subtitle}</p>}
        <div className="sw-schedule__desktop">
          <div className="sw-schedule__line" aria-hidden="true" />
          <div className="sw-schedule__grid">
            {items.map((item, i) => {
              const Icon = scheduleIcons[i] || Heart;
              return (
                <div key={item.time} className="sw-schedule__item">
                  <span className="sw-schedule__time-badge">{item.time}</span>
                  <div className="sw-schedule__icon">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="sw-schedule__mobile">
          <div className="sw-schedule__vline" aria-hidden="true" />
          <div className="sw-schedule__vlist">
            {items.map((item, i) => {
              const Icon = scheduleIcons[i] || Heart;
              return (
                <div key={item.time} className="sw-schedule__vitem">
                  <div className="sw-schedule__vicon">
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div className="sw-schedule__vcopy">
                    <div className="sw-schedule__vhead">
                      <span className="sw-schedule__vtime">{item.time}</span>
                      <h3>{item.title}</h3>
                    </div>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SweetloveGifts({ title, body, accordionTitle, cashNote, transferIntro, iban, confettiUrl }) {
  const [open, setOpen] = useState(false);
  const [showIban, setShowIban] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const toggle = () => {
    if (!open) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2200);
    }
    setOpen((v) => !v);
  };
  return (
    <section className="sw-gifts" aria-labelledby="gifts-title">
      {showConfetti && confettiUrl && (
        <div className="sw-gifts__confetti" aria-hidden="true">
          <img src={confettiUrl} alt="" />
        </div>
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title" className="sw-script">{title}</h2>
        <p className="sw-gifts__body">{body}</p>
        <div className="sw-gifts__card">
          <button type="button" className="sw-gifts__trigger" aria-expanded={open} onClick={toggle}>
            <span>{accordionTitle}</span>
            <ChevronDown size={18} className={open ? "is-open" : ""} aria-hidden="true" />
          </button>
          {open && (
            <div className="sw-gifts__panel">
              <p className="sw-gifts__note">{cashNote}</p>
              <p className="sw-gifts__note">{transferIntro}</p>
              <div className="sw-gifts__iban">
                {showIban ? (
                  <>
                    <p className="sw-gifts__iban-label">IBAN</p>
                    <p className="sw-gifts__iban-value">{iban}</p>
                  </>
                ) : (
                  <button type="button" className="sw-gifts__show-iban" onClick={() => setShowIban(true)}>
                    Mostrar IBAN
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SweetloveRsvp({ title, subtitle, rsvpConfirmationVideoUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState("yes");
  const [guestCount, setGuestCount] = useState("1");
  const [companions, setCompanions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [otherAllergy, setOtherAllergy] = useState("");
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
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

  const allergyOptions = [
    { id: "gluten", label: "Sin gluten / Celíaco" },
    { id: "lactose", label: "Sin lactosa" },
    { id: "vegetarian", label: "Vegetariano" },
    { id: "vegan", label: "Vegano" },
    { id: "nuts", label: "Alergia a frutos secos" },
    { id: "seafood", label: "Alergia a mariscos" },
  ];

  function handleGuestCountChange(value) {
    setGuestCount(value);
    const n = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
    const needed = Math.max(0, n - 1);
    setCompanions((prev) => (needed > prev.length ? [...prev, ...Array(needed - prev.length).fill("")] : prev.slice(0, needed)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (attending === "yes" && companions.some((c) => !c.trim())) {
      setStatus("Por favor, indica el nombre de todos los acompañantes.");
      return;
    }
    setConfirmAttending(attending);
    setConfirmed(true);
    setShowThanks(attending === "no");
    setStatus("");
  }

  const guestCountNum = parseInt(guestCount, 10) || 1;

  if (confirmed) {
    if (confirmAttending === "no") {
      return (
        <section className="sw-rsvp sw-rsvp--thanks" id="rsvp">
          <div className="section-inner narrow" data-reveal>
            <h2 className="sw-script">Gracias</h2>
            <p className="sw-rsvp__thanks">Sentimos mucho que no puedas acompañarnos. Te tendremos muy presente en este día tan especial.</p>
            <p className="sw-script sw-rsvp__sig">— Laura &amp; Javier</p>
          </div>
        </section>
      );
    }
    return (
      <section className="sw-rsvp__confirm-wrap" id="rsvp" aria-live="polite">
        {!showThanks && rsvpConfirmationVideoUrl ? (
          <div className="sw-rsvp__video-stage">
            <video
              ref={videoRef}
              src={rsvpConfirmationVideoUrl}
              autoPlay
              muted
              playsInline
              className="sw-rsvp__video"
            />
            <div className={`sw-rsvp__video-fade ${showThanks ? "is-visible" : ""}`} aria-hidden="true" />
          </div>
        ) : (
          <div className="sw-rsvp__thanks-stage">
            <h2 className="sw-script sw-rsvp__thanks-title">Gracias por confirmar tu asistencia</h2>
            <div className="sw-rsvp__thanks-body">
              <p>Nos hace muchísima ilusión saber que nos acompañarás en este día tan especial.</p>
              <p>Gracias por formar parte de nuestra historia.</p>
              <p className="sw-rsvp__thanks-venue">Te esperamos el 18 de mayo en Masia Can Cortada, Barcelona.</p>
            </div>
            <p className="sw-script sw-rsvp__sig">— Laura &amp; Javier</p>
            <a
              className="sw-btn sw-btn--outline sw-rsvp__calendar"
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Laura%20%26%20Javier&dates=20260518T163000Z/20260519T023000Z&location=Masia%20Can%20Cortada%2C%20Barcelona"
              target="_blank"
              rel="noreferrer"
            >
              <Calendar size={16} aria-hidden="true" />
              Añadir al calendario
            </a>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="sw-rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title" className="sw-script">{title}</h2>
        {subtitle && <p className="sw-rsvp__subtitle">{subtitle}</p>}
        <form className="sw-rsvp__form" onSubmit={handleSubmit}>
          <label>
            Nombre completo *
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
          </label>
          <label>
            Email (opcional)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
          </label>
          <fieldset>
            <legend>¿Asistirás? *</legend>
            <label className="sw-radio">
              <input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} />
              Sí, asistiré
            </label>
            <label className="sw-radio">
              <input type="radio" name="attending" value="no" checked={attending === "no"} onChange={() => setAttending("no")} />
              No podré asistir
            </label>
          </fieldset>

          {attending === "yes" && (
            <>
              <label>
                Número de invitados (incluyéndote)
                <input type="number" min="1" max="10" value={guestCount} onChange={(e) => handleGuestCountChange(e.target.value)} />
              </label>

              {guestCountNum > 1 && (
                <div className="sw-rsvp__companions">
                  <p className="sw-rsvp__label">Nombres de los acompañantes *</p>
                  <p className="sw-rsvp__help">Por favor, indícanos el nombre de las personas que te acompañarán:</p>
                  {companions.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      required
                      value={val}
                      onChange={(e) => {
                        const next = [...companions];
                        next[idx] = e.target.value;
                        setCompanions(next);
                      }}
                      placeholder={`Acompañante ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="sw-rsvp__allergies">
                <p className="sw-rsvp__label">Alergias e intolerancias alimentarias</p>
                <p className="sw-rsvp__help">Es muy importante para nosotros conocer cualquier restricción alimentaria. Selecciona las que apliquen:</p>
                <div className="sw-rsvp__allergy-grid">
                  {allergyOptions.map((opt) => (
                    <label key={opt.id} className="sw-checkbox">
                      <input
                        type="checkbox"
                        checked={allergies.includes(opt.id)}
                        onChange={() =>
                          setAllergies((prev) => (prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]))
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <label>
                  Otras alergias o restricciones:
                  <input type="text" value={otherAllergy} onChange={(e) => setOtherAllergy(e.target.value)} placeholder="Ej: alergia al huevo, intolerancia a la fructosa..." />
                </label>
              </div>
            </>
          )}

          <label>
            Mensaje para los novios (opcional)
            <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escríbenos unas palabras..." />
          </label>

          <button type="submit" className="sw-rsvp__submit">
            <Send size={16} aria-hidden="true" />
            Enviar confirmación
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function SweetloveDivider() {
  return (
    <div className="sw-divider" aria-hidden="true">
      <span className="sw-divider__line" />
      <span className="sw-divider__heart">♥</span>
      <span className="sw-divider__line" />
    </div>
  );
}

function SweetloveFooter({ names, date, loveLine, creditLine, creditName, creditUrl }) {
  return (
    <footer className="sw-footer">
      <span className="sw-footer__heart" aria-hidden="true">♥</span>
      <p className="sw-footer__names sw-script">{names}</p>
      {date && <p className="sw-footer__date">{date}</p>}
      {loveLine && <p className="sw-footer__love">{loveLine}</p>}
      {creditLine && creditName && (
        <p className="sw-footer__credit">
          {creditLine}{" "}
          {creditUrl ? (
            <a href={creditUrl} target="_blank" rel="noreferrer">
              {creditName}
            </a>
          ) : (
            creditName
          )}
        </p>
      )}
    </footer>
  );
}

const sectionComponents = {
  hero: SweetloveHero,
  countdown: Countdown,
  details: SweetloveVenue,
  schedule: SweetloveSchedule,
  gifts: SweetloveGifts,
  rsvp: SweetloveRsvp,
  credit: SweetloveFooter,
  imageDivider: SweetloveDivider,
};

export function SweetloveInvitation() {
  const { theme, media, copy, sections } = invitationData;
  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="sw-shell"
      contentClassName="sw-content"
    />
  );
}
