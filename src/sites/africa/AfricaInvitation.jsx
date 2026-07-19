import React, { useCallback, useEffect, useRef, useState } from "react";
import { Music, Music2 } from "lucide-react";
import { invitationData } from "./data.js";
import VideoOpenIntro from "../../shared/intros/VideoOpenIntro.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Welcome from "../../shared/sections/Welcome.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import Story from "../../shared/sections/Story.jsx";
import DressCode from "../../shared/sections/DressCode.jsx";
import Gifts from "../../shared/sections/Gifts.jsx";
import Rsvp from "../../shared/sections/Rsvp.jsx";
import Faq from "../../shared/sections/Faq.jsx";
import "./styles.css";

const sectionComponents = {
  hero: Hero,
  countdown: Countdown,
  welcome: Welcome,
  schedule: Schedule,
  story: Story,
  dressCode: DressCode,
  gifts: Gifts,
  rsvp: Rsvp,
  faq: Faq,
  footer: AfricaFooter,
};

function AfricaFooter({ names, date, creditLine, creditName, frameUrl }) {
  return (
    <footer className="africa-footer">
      {frameUrl && <img className="africa-footer__frame" src={frameUrl} alt="" aria-hidden="true" />}
      <div className="africa-footer__copy">
        {names && <strong>{names}</strong>}
        {date && <span>{date}</span>}
        {creditLine && (
          <p className="africa-footer__credit">
            {creditLine} {creditName}
          </p>
        )}
      </div>
    </footer>
  );
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

export function AfricaInvitation() {
  const audioRef = useRef(null);
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const { theme, media, copy, sections } = invitationData;
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
      className="africa-shell"
      style={{
        "--background": theme.background,
        "--foreground": theme.foreground,
        "--muted": theme.muted,
        "--ivory": theme.ivory,
      }}
    >
      <audio ref={audioRef} loop preload="auto" src={media.musicUrl} />

      <VideoOpenIntro
        posterUrl={media.introPosterUrl}
        videoUrl={media.introVideoUrl}
        tapLabel={copy.tapLabel}
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

      <div className={`africa-content ${introDone ? "is-visible" : ""}`}>
        {sections.map((section, index) => {
          const Component = sectionComponents[section.type];
          if (!Component) return null;
          return <Component key={section.id ?? `${section.type}-${index}`} {...section.props} />;
        })}
      </div>
    </main>
  );
}
