import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, MapPin, Music, Music2, Send } from "lucide-react";
import { invitationData } from "./data";
import "./styles.css";

function useCountdown(date) {
  const target = useMemo(() => new Date(date).getTime(), [date]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return timeLeft;
}

function getTimeLeft(target) {
  const distance = Math.max(0, target - Date.now());

  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };
}

function useRevealOnScroll(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -70px 0px", threshold: 0.16 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [enabled]);
}

export function VideoOpenInvitation() {
  const audioRef = useRef(null);
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const { theme, media } = invitationData;
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useRevealOnScroll(introDone);

  useEffect(() => {
    document.body.style.background = theme.background;
    return () => {
      document.body.style.background = "";
    };
  }, [theme.background]);

  async function startExperience() {
    if (opened) return;
    setOpened(true);

    try {
      await audioRef.current?.play();
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
    }
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setMusicPlaying(true);
      } catch {
        setMusicPlaying(false);
      }
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }

  return (
    <main
      className="invitation-shell"
      style={{
        "--background": theme.background,
        "--foreground": theme.foreground,
        "--muted": theme.muted,
        "--ivory": theme.ivory,
      }}
    >
      <audio ref={audioRef} loop preload="auto" src={media.musicUrl} />

      <PosterVideoIntro
        isOpen={opened}
        isFinished={introDone}
        onStart={startExperience}
        onFinished={finishIntro}
      />

      <button
        className={`music-button ${introDone ? "is-visible" : ""}`}
        type="button"
        aria-label={musicPlaying ? "Pause music" : "Play music"}
        onClick={toggleMusic}
      >
        {musicPlaying ? <Music2 size={19} /> : <Music size={19} />}
      </button>

      <div className={`invitation-content ${introDone ? "is-visible" : ""}`}>
        <HeroVideoSection />
        <CountdownSection />
        <ImageDivider />
        <WelcomeSection />
        <ScheduleSection />
        <VenueDetailsSection />
        <MapSection />
        <MessageSection />
        <FooterSection />
      </div>
    </main>
  );
}

function PosterVideoIntro({ isOpen, isFinished, onStart, onFinished }) {
  const videoRef = useRef(null);
  const { media, copy } = invitationData;

  useEffect(() => {
    if (!isOpen) return;

    let fallbackTimer;
    const video = videoRef.current;

    async function playIntro() {
      try {
        await video?.play();
      } catch {
        onFinished();
        return;
      }

      fallbackTimer = window.setTimeout(onFinished, 5200);
    }

    playIntro();
    return () => window.clearTimeout(fallbackTimer);
  }, [isOpen, onFinished]);

  return (
    <button
      className={`intro-layer ${isOpen ? "is-playing" : ""} ${isFinished ? "is-finished" : ""}`}
      type="button"
      onClick={onStart}
      aria-label="Open invitation"
    >
      <img className="intro-poster" src={media.introPosterUrl} alt="Invitation opening poster" />
      <video
        ref={videoRef}
        className="intro-video"
        src={media.introVideoUrl}
        muted
        playsInline
        preload="auto"
        onEnded={onFinished}
      />
      <span className="tap-label">{copy.tapLabel}</span>
    </button>
  );
}

function HeroVideoSection() {
  const { couple, event, media } = invitationData;

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <video className="hero-video" src={media.heroVideoUrl} autoPlay muted loop playsInline />
      <div className="hero-scrim" />
      <div className="hero-copy" data-reveal>
        <p className="eyebrow">{couple.headline}</p>
        <h1 id="hero-title">
          {couple.firstName} <span>&</span> {couple.secondName}
        </h1>
        <p className="date-line">{event.displayDate}</p>
      </div>
    </section>
  );
}

function CountdownSection() {
  const { event } = invitationData;
  const timeLeft = useCountdown(event.date);

  return (
    <section className="countdown-section" id="countdown" aria-labelledby="countdown-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="countdown-title">Countdown</h2>
        <div className="countdown-grid">
          <TimeBox value={timeLeft.days} label="Days" />
          <TimeBox value={timeLeft.hours} label="Hours" pad />
          <TimeBox value={timeLeft.minutes} label="Mins" pad />
          <TimeBox value={timeLeft.seconds} label="Secs" pad />
        </div>
      </div>
    </section>
  );
}

function TimeBox({ value, label, pad = false }) {
  const shown = pad ? String(value).padStart(2, "0") : value;

  return (
    <div className="time-box">
      <strong>{shown}</strong>
      <span>{label}</span>
    </div>
  );
}

function ImageDivider() {
  return (
    <div className="image-divider" aria-hidden="true">
      <img src={invitationData.media.stringLightsUrl} alt="" />
    </div>
  );
}

function WelcomeSection() {
  const { copy } = invitationData;

  return (
    <section className="welcome-section" aria-labelledby="welcome-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="welcome-title">{copy.welcomeTitle}</h2>
        <p>{copy.welcome}</p>
      </div>
    </section>
  );
}

function ScheduleSection() {
  const { copy, schedule, media } = invitationData;

  return (
    <section className="schedule-section" aria-labelledby="schedule-title">
      <img className="dancing-art" src={media.coupleDancingUrl} alt="" aria-hidden="true" />
      <div className="section-inner" data-reveal>
        <h2 id="schedule-title">{copy.scheduleTitle}</h2>
        <p className="section-kicker">{copy.scheduleSubtitle}</p>
        <div className="schedule-list">
          {schedule.map((item) => (
            <article className="schedule-item" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VenueDetailsSection() {
  const { copy, event, media } = invitationData;

  return (
    <section className="details-section" aria-labelledby="details-title">
      <div className="section-inner" data-reveal>
        <h2 id="details-title">{copy.detailsTitle}</h2>
        <p className="section-kicker">{copy.detailsSubtitle}</p>
        <div className="badge-frame">
          <img src={media.ornateBadgeUrl} alt="" aria-hidden="true" />
          <div>
            <h3>Location</h3>
            <p className="venue-name">{event.venue}</p>
            <p className="time-line">
              <Clock size={16} aria-hidden="true" />
              From {event.startTime} to {event.endTime}
            </p>
          </div>
        </div>
        <a className="map-link" href={event.mapUrl} target="_blank" rel="noreferrer">
          <MapPin size={17} aria-hidden="true" />
          Google Maps
        </a>
      </div>
    </section>
  );
}

function MapSection() {
  return (
    <section className="map-section" aria-label="Venue map">
      <div className="map-frame" data-reveal>
        <iframe
          title="La Reine venue map"
          src="/maps/embed/index.html"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function MessageSection() {
  const [status, setStatus] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus("Your message is saved locally for this preview.");
  }

  return (
    <section className="message-section" aria-labelledby="message-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="message-title">Leave a Message</h2>
        <p className="section-kicker">Share your love, wishes, or a note for the happy couple.</p>
        <form className="message-form" onSubmit={handleSubmit}>
          <label>
            Guest Name(s)
            <input name="guestName" type="text" maxLength="100" placeholder="Your name" required />
          </label>
          <label>
            Your Message
            <textarea name="message" maxLength="1000" rows="4" placeholder="Write us a few words..." required />
          </label>
          <button type="submit">
            <Send size={17} aria-hidden="true" />
            Send Message
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="footer-section">
      <img src={invitationData.media.footerOrnamentUrl} alt="" aria-hidden="true" />
    </footer>
  );
}
