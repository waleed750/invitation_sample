import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import Gifts from "../../shared/sections/Gifts.jsx";
import "./styles.css";

function AventurerosCountdown({ date, title, untilLabel }) {
  const target = React.useMemo(() => new Date(date).getTime(), [date]);
  const [timeLeft, setTimeLeft] = useState(() => {
    const d = Math.max(0, target - Date.now());
    return {
      days: Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      minutes: Math.floor((d % 3600000) / 60000),
      seconds: Math.floor((d % 60000) / 1000),
    };
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const d = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(d / 86400000),
        hours: Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000) / 60000),
        seconds: Math.floor((d % 60000) / 1000),
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <section className="countdown-section" id="countdown" aria-labelledby="countdown-title">
      <div className="countdown-panel">
        <div className="section-inner narrow" data-reveal>
          <h2 id="countdown-title">{title}</h2>
          {untilLabel && <p className="countdown-until">{untilLabel}</p>}
          <div className="countdown-grid">
            <div className="time-box"><strong>{String(timeLeft.days).padStart(2, "0")}</strong><span>Días</span></div>
            <div className="time-box"><strong>{String(timeLeft.hours).padStart(2, "0")}</strong><span>Horas</span></div>
            <div className="time-box"><strong>{String(timeLeft.minutes).padStart(2, "0")}</strong><span>Minutos</span></div>
            <div className="time-box"><strong>{String(timeLeft.seconds).padStart(2, "0")}</strong><span>Segundos</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AventurerosDetails({ title, subtitle, venue, location, startTime, endTime, mapUrl, calendarLabel }) {
  return (
    <section className="details-section" aria-labelledby="details-title">
      <div className="section-inner" data-reveal>
        <h2 id="details-title">{title}</h2>
        <p className="section-kicker">{subtitle}</p>
        <div className="details-card">
          <p className="details-label">Localización</p>
          <p className="details-venue">{venue}</p>
          <p className="details-location">{location}</p>
          <p className="details-time">De {startTime} a {endTime}</p>
        </div>
        <div className="details-actions">
          <a className="details-map-link" href={mapUrl} target="_blank" rel="noreferrer">
            Abrir en Maps
          </a>
          {calendarLabel && (
            <button type="button" className="details-calendar-btn">{calendarLabel}</button>
          )}
        </div>
      </div>
    </section>
  );
}

function AventurerosRsvp({ title, subtitle, confirmationVideoUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState(null);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmVideo, setShowConfirmVideo] = useState(false);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!showConfirmVideo || !confirmRef.current) return;
    const p = confirmRef.current.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [showConfirmVideo]);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setShowConfirmVideo(true);
    setTimeout(() => setShowConfirmVideo(false), 5000);
  }

  if (showConfirmVideo) {
    return (
      <section className="rsvp-section rsvp-section--confirm">
        <video ref={confirmRef} src={confirmationVideoUrl} autoPlay muted playsInline className="rsvp-confirm-video" />
      </section>
    );
  }

  return (
    <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title">{title}</h2>
        <p className="section-kicker">{subtitle}</p>
        <form className="rsvp-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo *
            <input name="fullName" type="text" maxLength="120" placeholder="Tu nombre completo" required />
          </label>
          <label>
            Email (opcional)
            <input name="email" type="email" maxLength="120" placeholder="tu@email.com" />
          </label>
          <fieldset>
            <legend>¿Asistirás? *</legend>
            <label className="rsvp-radio">
              <input type="radio" name="attending" value="yes" required onChange={() => setAttending(true)} />
              Sí, asistiré
            </label>
            <label className="rsvp-radio">
              <input type="radio" name="attending" value="no" onChange={() => setAttending(false)} />
              No podré asistir
            </label>
          </fieldset>
          {attending && (
            <>
              <label>
                Adultos (incluyéndote)
                <div className="rsvp-counter">
                  <button type="button" disabled={adults <= 1} onClick={() => setAdults((c) => Math.max(1, c - 1))}>-</button>
                  <span>{adults}</span>
                  <button type="button" onClick={() => setAdults((c) => Math.min(10, c + 1))}>+</button>
                </div>
              </label>
              <label>
                Niños
                <div className="rsvp-counter">
                  <button type="button" disabled={kids <= 0} onClick={() => setKids((c) => Math.max(0, c - 1))}>-</button>
                  <span>{kids}</span>
                  <button type="button" onClick={() => setKids((c) => Math.min(10, c + 1))}>+</button>
                </div>
              </label>
            </>
          )}
          <label>
            Tus alergias o intolerancias
            <input name="allergies" type="text" maxLength="200" placeholder="Indica tus alergias" />
          </label>
          <label>
            Mensaje para los novios (opcional)
            <textarea name="message" maxLength="1000" rows="4" placeholder="Escribe un mensaje..." />
          </label>
          <button type="submit">
            <Send size={14} aria-hidden="true" />
            Enviar confirmación
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function AventurerosFooter({ names, date, creditLine, creditName }) {
  return (
    <footer className="aventureros-footer">
      <div className="aventureros-footer__copy">
        <strong>{names}</strong>
        <span>{date}</span>
        <p className="aventureros-footer__credit">
          {creditLine} <a href="https://www.thedigitalyes.com" target="_blank" rel="noopener noreferrer">{creditName}</a>
        </p>
      </div>
    </footer>
  );
}

const sectionComponents = {
  hero: Hero,
  countdown: AventurerosCountdown,
  details: AventurerosDetails,
  schedule: Schedule,
  gifts: Gifts,
  rsvp: AventurerosRsvp,
  footer: AventurerosFooter,
};

export function AventurerosInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="aventureros-shell"
      contentClassName="aventureros-content"
    />
  );
}
