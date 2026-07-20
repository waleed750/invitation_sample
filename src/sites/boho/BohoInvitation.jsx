import React, { useEffect, useRef, useState } from "react";
import { Send, ChevronDown } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Faq from "../../shared/sections/Faq.jsx";
import "./styles.css";

function WeddingWeekend({ eyebrow, title, body, events, tileFrameUrl, leafDividerUrl, palmSunsetUrl }) {
  return (
    <section className="bw-weekend">
      <div className="bw-weekend__inner">
        {tileFrameUrl && <img className="bw-weekend__frame" src={tileFrameUrl} alt="" aria-hidden="true" />}
        <div className="bw-weekend__content">
          <p className="bw-eyebrow">{eyebrow}</p>
          <h2 className="bw-heading bw-heading--lg">{title}</h2>
          <p className="bw-body">{body}</p>
          {leafDividerUrl && <img className="bw-divider-sm" src={leafDividerUrl} alt="" aria-hidden="true" />}
          <div className="bw-weekend__events">
            {events.map((ev, i) => (
              <div key={i} className="bw-weekend__event">
                <p className="bw-weekend__date-label">{ev.dateLabel}</p>
                <p className="bw-weekend__event-title">{ev.title}</p>
              </div>
            ))}
          </div>
          {palmSunsetUrl && <img className="bw-divider-lg" src={palmSunsetUrl} alt="" aria-hidden="true" />}
        </div>
      </div>
    </section>
  );
}

function TravelInfo({ eyebrow, title, body, airports, shellDividerUrl, flowerDividerUrl, palmDividerUrl, palmStampUrl }) {
  return (
    <section className="bw-travel">
      <div className="bw-travel__inner">
        {shellDividerUrl && <img className="bw-divider-md" src={shellDividerUrl} alt="" aria-hidden="true" />}
        <p className="bw-eyebrow">{eyebrow}</p>
        <div className="bw-travel__heading-wrap">
          {palmStampUrl && <img className="bw-travel__stamp" src={palmStampUrl} alt="" aria-hidden="true" />}
          <h2 className="bw-heading bw-heading--lg">{title}</h2>
        </div>
        {flowerDividerUrl && <img className="bw-divider-md" src={flowerDividerUrl} alt="" aria-hidden="true" />}
        <p className="bw-body">{body}</p>
        <div className="bw-travel__airports">
          {airports.map((ap, i) => (
            <div key={i} className="bw-travel__airport">
              {ap.frameUrl && <img className="bw-travel__airport-frame" src={ap.frameUrl} alt="" aria-hidden="true" />}
              {ap.illustrationUrl && <img className="bw-travel__airport-ill bw-travel__airport-ill--single" src={ap.illustrationUrl} alt="" aria-hidden="true" />}
              {ap.illustrations && ap.illustrations.map((url, j) => (
                <img key={j} className={`bw-travel__airport-ill bw-travel__airport-ill--${j}`} src={url} alt="" aria-hidden="true" />
              ))}
              <div className="bw-travel__airport-info">
                <p className="bw-travel__airport-code">{ap.code}</p>
                <p className="bw-travel__airport-name">{ap.name}</p>
                <p className="bw-travel__airport-location">{'\u2022'} {ap.location} {'\u2022'}</p>
              </div>
            </div>
          ))}
        </div>
        {palmDividerUrl && <img className="bw-divider-md" src={palmDividerUrl} alt="" aria-hidden="true" />}
      </div>
    </section>
  );
}

function BohoRsvp({ title, subtitle, bgUrl, decorations, wavesPosterUrl, wavesVideoUrl, confirmationVideoUrl }) {
  const [status, setStatus] = useState("");
  const [attending, setAttending] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmVideo, setShowConfirmVideo] = useState(false);
  const wavesRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const el = wavesRef.current;
    if (!el) return;
    const play = () => { const p = el.play(); if (p && typeof p.catch === "function") p.catch(() => {}); };
    play();
    el.addEventListener("loadeddata", play);
    return () => el.removeEventListener("loadeddata", play);
  }, []);

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
      <section className="bw-rsvp bw-rsvp--confirm">
        <video ref={confirmRef} src={confirmationVideoUrl} autoPlay muted playsInline className="bw-rsvp__confirm-video" />
      </section>
    );
  }

  return (
    <section className="bw-rsvp" id="rsvp">
      <div className="bw-rsvp__inner">
        {bgUrl && <img className="bw-rsvp__frame" src={bgUrl} alt="" aria-hidden="true" />}
        {decorations && decorations.map((url, i) => (
          <img key={i} className={`bw-rsvp__deco bw-rsvp__deco--${i}`} src={url} alt="" aria-hidden="true" />
        ))}
        <div className="bw-rsvp__content">
          <h2 className="bw-heading bw-heading--lg">{title}</h2>
          <form className="bw-rsvp__form" onSubmit={handleSubmit}>
            <label className="bw-rsvp__label">
              Full name
              <input name="fullName" type="text" maxLength="120" placeholder="Enter your full name" required className="bw-rsvp__input" />
            </label>
            <fieldset className="bw-rsvp__fieldset">
              <legend className="bw-rsvp__legend">Are you likely to attend?</legend>
              <label className="bw-rsvp__radio">
                <input type="radio" name="attending" value="yes" required onChange={() => setAttending(true)} />
                <span>Yes, I plan to be there</span>
              </label>
              <label className="bw-rsvp__radio">
                <input type="radio" name="attending" value="maybe" onChange={() => setAttending(null)} />
                <span>{"Maybe \u2014 I'll do my best"}</span>
              </label>
              <label className="bw-rsvp__radio">
                <input type="radio" name="attending" value="no" onChange={() => setAttending(false)} />
                <span>Unfortunately, I can't make it</span>
              </label>
            </fieldset>
            {attending && (
              <label className="bw-rsvp__label">
                How many guests?
                <div className="bw-rsvp__counter">
                  <button type="button" disabled={guestCount <= 1} onClick={() => setGuestCount((c) => Math.max(1, c - 1))}>-</button>
                  <span>{guestCount}</span>
                  <button type="button" onClick={() => setGuestCount((c) => Math.min(10, c + 1))}>+</button>
                </div>
              </label>
            )}
            <label className="bw-rsvp__label">
              A short message for the couple
              <textarea name="message" maxLength="1000" rows="4" placeholder="Share a wish, a memory, or anything you'd like us to read..." className="bw-rsvp__textarea" />
            </label>
            <button type="submit" className="bw-rsvp__submit">
              <Send size={14} aria-hidden="true" />
              Send Response
            </button>
          </form>
        </div>
      </div>
      <div className="bw-rsvp__waves">
        <img src={wavesPosterUrl} alt="" aria-hidden="true" className="bw-rsvp__waves-poster" />
        <video ref={wavesRef} src={wavesVideoUrl} autoPlay muted loop playsInline preload="auto" poster={wavesPosterUrl} className="bw-rsvp__waves-video" />
      </div>
    </section>
  );
}

function BohoFooter({ names, month, year, frameUrl, monogramUrl, starfishUrl, creditLine, creditName }) {
  return (
    <footer className="bw-footer">
      <div className="bw-footer__inner">
        {frameUrl && <img className="bw-footer__frame" src={frameUrl} alt="" aria-hidden="true" />}
        <div className="bw-footer__content">
          {monogramUrl && <img className="bw-footer__monogram" src={monogramUrl} alt="" aria-hidden="true" />}
          <p className="bw-footer__names">{names}</p>
          <div className="bw-footer__date">
            <span>{month}</span>
            <span>{year}</span>
          </div>
          {starfishUrl && <img className="bw-footer__starfish" src={starfishUrl} alt="" aria-hidden="true" />}
          <p className="bw-footer__credit">
            {creditLine} <a href="https://www.thedigitalyes.com" target="_blank" rel="noopener noreferrer">{creditName}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

const sectionComponents = {
  hero: Hero,
  countdown: Countdown,
  weddingWeekend: WeddingWeekend,
  travelInfo: TravelInfo,
  faq: Faq,
  rsvp: BohoRsvp,
  bohoFooter: BohoFooter,
};

export function BohoInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="boho-shell"
      contentClassName="boho-content"
    />
  );
}
