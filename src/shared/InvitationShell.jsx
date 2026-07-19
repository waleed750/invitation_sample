import React, { useCallback, useEffect, useRef, useState } from "react";
import { Music, Music2 } from "lucide-react";
import VideoOpenIntro from "./intros/VideoOpenIntro.jsx";

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

/**
 * Shared invitation shell: owns the reveal-on-scroll hook, audio/music toggle,
 * body-background effect, theme CSS custom properties, intro wiring, and
 * section render loop.
 *
 * @param {Object} props
 * @param {Object} props.theme       — { background, foreground, muted, ivory }
 * @param {Object} props.media       — { musicUrl, introPosterUrl, introVideoUrl }
 * @param {Object} props.copy        — { tapLabel }
 * @param {Array}  props.sections    — section data array from data.js
 * @param {Object} props.sectionComponents — map of type → Component
 * @param {string} props.shellClassName — outer <main> class (e.g. "invitation-shell" / "africa-shell")
 * @param {string} props.contentClassName — inner content <div> class (e.g. "invitation-content" / "africa-content")
 * @param {React.ComponentType} [props.introComponent] — override intro (defaults to VideoOpenIntro)
 */
export default function InvitationShell({
  theme,
  media,
  copy,
  sections,
  sectionComponents,
  shellClassName,
  contentClassName,
  introComponent: IntroComponent = VideoOpenIntro,
}) {
  const audioRef = useRef(null);
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
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
      className={shellClassName}
      style={{
        "--background": theme.background,
        "--foreground": theme.foreground,
        "--muted": theme.muted,
        "--ivory": theme.ivory,
      }}
    >
      <audio ref={audioRef} loop preload="auto" src={media.musicUrl} />

      <IntroComponent
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

      <div className={`${contentClassName} ${introDone ? "is-visible" : ""}`}>
        {sections.map((section, index) => {
          const Component = sectionComponents[section.type];
          if (!Component) return null;
          return <Component key={section.id ?? `${section.type}-${index}`} {...section.props} />;
        })}
      </div>
    </main>
  );
}
