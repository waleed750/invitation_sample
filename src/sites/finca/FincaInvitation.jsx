import React, { useState } from "react";
import { Send, ChevronDown, Heart, Wine, Church, UtensilsCrossed, Music, PartyPopper, MapPin, Calendar, Clock, Bed } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import "./styles.css";

function FincaHero({ headline, firstName, secondName, displayDate, heroVideoUrl, heroPosterUrl, ctaLabel }) {
  const scrollToRsvp = () => {
    const el = document.getElementById("rsvp");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="fi-hero" aria-labelledby="hero-title">
      <div className="fi-hero__media">
        {heroVideoUrl && (
          <video
            className="fi-hero__video"
            src={heroVideoUrl}
            poster={heroPosterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
        <div className="fi-hero__scrim" />
      </div>
      <div className="fi-hero__copy">
        {headline && <p className="fi-hero__eyebrow">{headline}</p>}
        {(firstName || secondName) && (
          <h1 id="hero-title" className="fi-hero__names">
            <span className="fi-hero__name">{firstName}</span>
            <span className="fi-hero__amp">&amp;</span>
            <span className="fi-hero__name">{secondName}</span>
          </h1>
        )}
        <div className="fi-hero__divider" aria-hidden="true">
          <span className="fi-hero__line" />
          <span className="fi-hero__diamond">✦</span>
          <span className="fi-hero__line" />
        </div>
        {displayDate && <p className="fi-hero__date">{displayDate}</p>}
      </div>
      {ctaLabel && (
        <button type="button" className="fi-hero__cue" onClick={scrollToRsvp} aria-label={ctaLabel}>
          <span>{ctaLabel}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function FincaVenue({ title, subtitle, venue, startTime, endTime, mapSrc, mapSearchUrl, calendarUrl, venueImageUrl, champagneUrl }) {
  return (
    <section className="fi-venue" aria-labelledby="venue-title">
      <div className="section-inner narrow" data-reveal>
        {champagneUrl && <img className="fi-venue__champagne" src={champagneUrl} alt="" aria-hidden="true" />}
        <h2 id="venue-title" className="fi-script">{title}</h2>
        {subtitle && <p className="fi-venue__subtitle">{subtitle}</p>}
        <div className="fi-venue__card">
          <div className="fi-venue__icon">
            <MapPin size={20} aria-hidden="true" />
          </div>
          <h3 className="fi-venue__venue-name">{venue}</h3>
          {(startTime || endTime) && (
            <p className="fi-venue__time">
              <Clock size={14} aria-hidden="true" />
              De {startTime} a {endTime}
            </p>
          )}
          {venueImageUrl && (
            <div className="fi-venue__photo">
              <img src={venueImageUrl} alt="Finca Biniagual - Vista aérea" loading="lazy" />
            </div>
          )}
          {mapSrc && (
            <div className="fi-venue__map">
              <iframe
                title={`Mapa de ${venue}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
          <div className="fi-venue__actions">
            {mapSearchUrl && (
              <a className="fi-btn fi-btn--outline" href={mapSearchUrl} target="_blank" rel="noreferrer">
                <MapPin size={14} aria-hidden="true" />
                Abrir en Maps
              </a>
            )}
            {calendarUrl && (
              <a className="fi-btn fi-btn--outline" href={calendarUrl} target="_blank" rel="noreferrer">
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

const scheduleIcons = [Heart, Wine, Church, Wine, UtensilsCrossed, Music, PartyPopper];

function FincaSchedule({ title, subtitle, illustrationUrl, items = [] }) {
  return (
    <section className="fi-schedule" aria-labelledby="schedule-title">
      <div className="section-inner" data-reveal>
        {illustrationUrl && <img className="fi-schedule__illustration" src={illustrationUrl} alt="" aria-hidden="true" />}
        <h2 id="schedule-title" className="fi-script">{title}</h2>
        {subtitle && <p className="fi-schedule__subtitle">{subtitle}</p>}
        {/* Desktop: horizontal timeline */}
        <div className="fi-schedule__desktop">
          <div className="fi-schedule__line" aria-hidden="true" />
          <div className="fi-schedule__grid">
            {items.map((item, i) => {
              const Icon = scheduleIcons[i] || Heart;
              return (
                <div key={item.time} className="fi-schedule__item">
                  <span className="fi-schedule__time-badge">{item.time}</span>
                  <div className="fi-schedule__icon">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
        {/* Mobile: vertical */}
        <div className="fi-schedule__mobile">
          <div className="fi-schedule__vline" aria-hidden="true" />
          <div className="fi-schedule__vlist">
            {items.map((item, i) => {
              const Icon = scheduleIcons[i] || Heart;
              return (
                <div key={item.time} className="fi-schedule__vitem">
                  <div className="fi-schedule__vicon">
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div className="fi-schedule__vcopy">
                    <div className="fi-schedule__vhead">
                      <span className="fi-schedule__vtime">{item.time}</span>
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

function FincaHotels({ title, subtitle, hotels = [] }) {
  if (!hotels.length) return null;
  return (
    <section className="fi-hotels" aria-labelledby="hotels-title">
      <div className="section-inner" data-reveal>
        <Bed className="fi-hotels__icon" size={28} aria-hidden="true" />
        <h2 id="hotels-title" className="fi-script">{title}</h2>
        {subtitle && <p className="fi-hotels__subtitle">{subtitle}</p>}
        <div className="fi-hotels__grid">
          {hotels.map((hotel) => (
            <article key={hotel.name} className="fi-hotel-card">
              <h3>{hotel.name}</h3>
              {hotel.description && <p className="fi-hotel__desc">{hotel.description}</p>}
              {hotel.link && (
                <a className="fi-btn fi-btn--outline fi-btn--sm" href={hotel.link} target="_blank" rel="noreferrer">
                  Ver detalles
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FincaGifts({ title, body, accordionTitle, cashNote, transferIntro, iban, confettiUrl }) {
  const [open, setOpen] = useState(false);
  const [showIban, setShowIban] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const toggle = () => {
    if (!open) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setOpen((v) => !v);
  };
  return (
    <section className="fi-gifts" aria-labelledby="gifts-title">
      {showConfetti && confettiUrl && (
        <div className="fi-gifts__confetti" aria-hidden="true">
          <img src={confettiUrl} alt="" />
        </div>
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title" className="fi-script">{title}</h2>
        <p className="fi-gifts__body">{body}</p>
        <div className="fi-gifts__card">
          <button type="button" className="fi-gifts__trigger" aria-expanded={open} onClick={toggle}>
            <span>{accordionTitle}</span>
            <ChevronDown size={18} className={open ? "is-open" : ""} aria-hidden="true" />
          </button>
          {open && (
            <div className="fi-gifts__panel">
              <p className="fi-gifts__note">{cashNote}</p>
              <p className="fi-gifts__note">{transferIntro}</p>
              <div className="fi-gifts__iban">
                {showIban ? (
                  <>
                    <p className="fi-gifts__iban-label">IBAN</p>
                    <p className="fi-gifts__iban-value">{iban}</p>
                  </>
                ) : (
                  <button type="button" className="fi-gifts__show-iban" onClick={() => setShowIban(true)}>
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

function FincaRsvp({ title, subtitle, ringsUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState("yes");
  const [guestCount, setGuestCount] = useState("1");
  const [companions, setCompanions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [otherAllergy, setOtherAllergy] = useState("");
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

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
    setStatus("Gracias por confirmar tu asistencia. ¡Nos vemos en la finca!");
  }

  const guestCountNum = parseInt(guestCount, 10) || 1;

  return (
    <section className="fi-rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="section-inner narrow" data-reveal>
        {ringsUrl && <img className="fi-rsvp__rings" src={ringsUrl} alt="" aria-hidden="true" />}
        <h2 id="rsvp-title" className="fi-script">{title}</h2>
        {subtitle && <p className="fi-rsvp__subtitle">{subtitle}</p>}
        <form className="fi-rsvp__form" onSubmit={handleSubmit}>
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
            <label className="fi-radio">
              <input type="radio" name="attending" value="yes" checked={attending === "yes"} onChange={() => setAttending("yes")} />
              Sí, asistiré
            </label>
            <label className="fi-radio">
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
                <div className="fi-rsvp__companions">
                  <p className="fi-rsvp__label">Nombres de los acompañantes *</p>
                  <p className="fi-rsvp__help">Por favor, indícanos el nombre de las personas que te acompañarán:</p>
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

              <div className="fi-rsvp__allergies">
                <p className="fi-rsvp__label">Alergias e intolerancias alimentarias</p>
                <p className="fi-rsvp__help">Es muy importante para nosotros conocer cualquier restricción alimentaria. Selecciona las que apliquen:</p>
                <div className="fi-rsvp__allergy-grid">
                  {allergyOptions.map((opt) => (
                    <label key={opt.id} className="fi-checkbox">
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

          <button type="submit" className="fi-rsvp__submit">
            <Send size={16} aria-hidden="true" />
            Enviar confirmación
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function FincaDivider() {
  return (
    <div className="fi-divider" aria-hidden="true">
      <span className="fi-divider__line" />
      <span className="fi-divider__diamond">✦</span>
      <span className="fi-divider__line" />
    </div>
  );
}

function FincaFooter({ names, date, creditLine, creditName, creditUrl }) {
  return (
    <footer className="fi-footer">
      <Heart size={20} className="fi-footer__heart" aria-hidden="true" />
      <p className="fi-footer__names fi-script">
        {names}
      </p>
      {date && <p className="fi-footer__date">{date}</p>}
      {creditLine && creditName && (
        <p className="fi-footer__credit">
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
  hero: FincaHero,
  countdown: Countdown,
  details: FincaVenue,
  schedule: FincaSchedule,
  hotelList: FincaHotels,
  gifts: FincaGifts,
  rsvp: FincaRsvp,
  credit: FincaFooter,
  imageDivider: FincaDivider,
};

export function FincaInvitation() {
  const { theme, media, copy, sections } = invitationData;
  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="fi-shell"
      contentClassName="fi-content"
    />
  );
}
