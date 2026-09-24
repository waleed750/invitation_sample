import React, { useState } from "react";
import { Send, ChevronDown, Heart, Wine, UtensilsCrossed, Music, MapPin, Calendar, Clock } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Rsvp from "../../shared/sections/Rsvp.jsx";
import "./styles.css";

function FloralHero({
  headline,
  firstName,
  secondName,
  subtitle,
  monthLabel,
  dayLabel,
  weekdayLabel,
  yearLabel,
  heroVideoUrl,
  heroPosterUrl,
  scrollCueLabel,
}) {
  return (
    <section className="fl-hero" aria-labelledby="hero-title">
      {heroVideoUrl && (
        <video
          className="fl-hero__video"
          src={heroVideoUrl}
          poster={heroPosterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <div className="fl-hero__overlay">
        <div className="fl-hero__copy" data-reveal>
          {headline && <p className="fl-hero__eyebrow fl-script">{headline}</p>}
          {(firstName || secondName) && (
            <h1 id="hero-title" className="fl-hero__names">
              <span className="fl-hero__name">{firstName}</span>
              <span className="fl-hero__amp">&amp;</span>
              <span className="fl-hero__name">{secondName}</span>
            </h1>
          )}
          {subtitle && <p className="fl-hero__subtitle fl-script">{subtitle}</p>}
          {(monthLabel || dayLabel || weekdayLabel) && (
            <div className="fl-hero__date-row">
              {monthLabel && <span className="fl-hero__date-part">{monthLabel}</span>}
              <span className="fl-hero__date-sep">|</span>
              {dayLabel && <span className="fl-hero__date-day">{dayLabel}</span>}
              <span className="fl-hero__date-sep">|</span>
              {weekdayLabel && <span className="fl-hero__date-part">{weekdayLabel}</span>}
            </div>
          )}
          {yearLabel && <p className="fl-hero__year">{yearLabel}</p>}
        </div>
        {scrollCueLabel && (
          <a href="#countdown" className="fl-hero__cue" aria-label={scrollCueLabel}>
            <span>{scrollCueLabel}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}

function FloralVenue({ kicker, title, subtitle, venue, time, mapSrc, mapSearchUrl, calendarUrl, ctaMapLabel, ctaCalendarLabel }) {
  return (
    <section className="fl-venue" aria-labelledby="venue-title">
      <div className="section-inner narrow" data-reveal>
        {kicker && <p className="fl-venue__kicker">{kicker}</p>}
        <h2 id="venue-title" className="fl-script fl-venue__title">{title}</h2>
        {subtitle && <p className="fl-venue__subtitle">{subtitle}</p>}
        <div className="fl-venue__card">
          <div className="fl-venue__icon">
            <MapPin size={22} aria-hidden="true" />
          </div>
          <h3 className="fl-venue__venue-name">{venue}</h3>
          {time && (
            <p className="fl-venue__time">
              <Clock size={14} aria-hidden="true" />
              {time}
            </p>
          )}
          {mapSrc && (
            <div className="fl-venue__map">
              <iframe
                title="Ubicación de la boda"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
          <div className="fl-venue__actions">
            {mapSearchUrl && (
              <a className="fl-btn fl-btn--outline" href={mapSearchUrl} target="_blank" rel="noreferrer">
                <MapPin size={14} aria-hidden="true" />
                {ctaMapLabel || "Cómo llegar"}
              </a>
            )}
            {calendarUrl && (
              <a className="fl-btn fl-btn--outline" href={calendarUrl} target="_blank" rel="noreferrer">
                <Calendar size={14} aria-hidden="true" />
                {ctaCalendarLabel || "Añadir al calendario"}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const programIcons = [Heart, Wine, UtensilsCrossed, Music];

function FloralSchedule({ title, subtitle, items = [] }) {
  return (
    <section className="fl-schedule" aria-labelledby="schedule-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="schedule-title" className="fl-script">{title}</h2>
        {subtitle && <p className="fl-schedule__subtitle">{subtitle}</p>}
        <div className="fl-schedule__grid">
          {items.map((item, i) => {
            const Icon = programIcons[i] || Heart;
            return (
              <div key={item.title} className="fl-schedule__item">
                <div className="fl-schedule__icon">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <h3>{item.title}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FloralGifts({ title, body, accordionTitle, iban }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="fl-gifts" aria-labelledby="gifts-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title" className="fl-script">{title}</h2>
        <p className="fl-gifts__body">{body}</p>
        <div className="fl-gifts__accordion">
          <button type="button" className="fl-gifts__trigger" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span>{accordionTitle}</span>
            <ChevronDown size={16} className={open ? "is-open" : ""} aria-hidden="true" />
          </button>
          {open && (
            <div className="fl-gifts__panel">
              <p className="fl-gifts__iban-label">IBAN</p>
              <p className="fl-gifts__iban">{iban}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FloralDivider() {
  return (
    <div className="fl-divider" aria-hidden="true">
      <span className="fl-divider__line" />
      <span className="fl-divider__heart">♥</span>
      <span className="fl-divider__line" />
    </div>
  );
}

function FloralFooter({ names, date, loveLine, creditLine, creditName, creditUrl }) {
  return (
    <footer className="fl-footer">
      <p className="fl-footer__names fl-script">{names}</p>
      {date && <p className="fl-footer__date">{date}</p>}
      {loveLine && <p className="fl-footer__love">{loveLine}</p>}
      {creditLine && creditName && (
        <p className="fl-footer__credit">
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
  hero: FloralHero,
  countdown: Countdown,
  details: FloralVenue,
  schedule: FloralSchedule,
  gifts: FloralGifts,
  imageDivider: FloralDivider,
  rsvp: Rsvp,
  credit: FloralFooter,
};

export function FloralInvitation() {
  const { theme, media, copy, sections } = invitationData;
  const floralBorder = media.floralBorderUrl;
  return (
    <div className="fl-decor-wrapper">
      {/* Side floral decorations — 6 right, 5 left varying opacity/size */}
      <div className="fl-decorations" aria-hidden="true">
        <img className="fl-deco fl-deco--r1" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--r2" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--r3" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--r4" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--r5" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--r6" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--l1" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--l2" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--l3" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--l4" src={floralBorder} alt="" />
        <img className="fl-deco fl-deco--l5" src={floralBorder} alt="" />
      </div>
      <InvitationShell
        theme={theme}
        media={media}
        copy={copy}
        sections={sections}
        sectionComponents={sectionComponents}
        shellClassName="fl-shell"
        contentClassName="fl-content"
      />
    </div>
  );
}
