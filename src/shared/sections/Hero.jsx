import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Hero section — couple names, headline, background video.
 *
 * Props:
 *   headline       — eyebrow text (e.g. "We're Getting Engaged") (optional)
 *   firstName      — first person's name (optional)
 *   secondName     — second person's name (optional)
 *   displayDate    — human-readable date (optional)
 *   heroVideoUrl   — background video src (optional)
 *   heroPosterUrl  — poster before video loads (optional)
 *   ctaLabel       — call-to-action text at bottom (optional)
 *   heroVideoLoop  — whether the background video should loop (default true).
 *                    Set false when the video is a self-contained one-shot
 *                    card reveal (already has its own baked-in couple names/
 *                    date text) rather than an ambient looping backdrop —
 *                    it will freeze on its last frame instead of repeating.
 *   showOverlayCopy — whether to render the text overlay (headline/names/date/
 *                    cta) on top of the video (default true). Set false when
 *                    the video already contains that copy baked into its
 *                    design, to avoid duplicated/overlapping text.
 *   scrollCueLabel — bottom scroll cue text, rendered independently from the
 *                    overlay copy (optional)
 *   overlayFadeOutAt — video timestamp in seconds when overlay fades out
 *                      (optional)
 */
export default function Hero({
  headline,
  firstName,
  secondName,
  displayDate,
  heroVideoUrl,
  heroPosterUrl,
  ctaLabel,
  heroVideoLoop = true,
  showOverlayCopy = true,
  scrollCueLabel,
  overlayFadeOutAt,
}) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const hasTimedOverlay = typeof overlayFadeOutAt === "number";

  useEffect(() => {
    if (!hasTimedOverlay) return undefined;

    const section = sectionRef.current;
    const video = videoRef.current;
    const content = section?.parentElement;
    if (!section || !video || !content) return undefined;

    let started = false;

    function startHeroVideo() {
      if (started) return;
      started = true;
      setOverlayHidden(false);
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    video.pause();
    video.currentTime = 0;

    if (content.classList.contains("is-visible")) {
      startHeroVideo();
      return undefined;
    }

    const observer = new MutationObserver(() => {
      if (content.classList.contains("is-visible")) {
        startHeroVideo();
        observer.disconnect();
      }
    });

    observer.observe(content, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [hasTimedOverlay, heroVideoUrl]);

  function handleVideoTimeUpdate(event) {
    if (!hasTimedOverlay) return;
    setOverlayHidden(event.currentTarget.currentTime >= overlayFadeOutAt);
  }

  return (
    <section
      ref={sectionRef}
      className="hero-section"
      aria-labelledby={firstName || secondName ? "hero-title" : undefined}
      aria-label={firstName || secondName ? undefined : "Wedding invitation"}
    >
      {heroVideoUrl && (
        <video
          ref={videoRef}
          className="hero-video"
          src={heroVideoUrl}
          poster={heroPosterUrl}
          autoPlay={!hasTimedOverlay}
          muted
          loop={heroVideoLoop}
          playsInline
          preload="metadata"
          onTimeUpdate={handleVideoTimeUpdate}
        />
      )}
      {showOverlayCopy && (
        <>
          <div className="hero-scrim" />
          <div className={`hero-copy ${overlayHidden ? "is-faded" : ""}`} data-reveal>
            {headline && <p className="eyebrow">{headline}</p>}
            {(firstName || secondName) && (
              <h1 id="hero-title">
                {firstName && <span className="hero-name-line">{firstName}</span>}
                <span className="hero-amp">&amp;</span>
                {secondName && <span className="hero-name-line">{secondName}</span>}
              </h1>
            )}
            {displayDate && <p className="date-line">{displayDate}</p>}
            {ctaLabel && <p className="hero-cta">{ctaLabel}</p>}
          </div>
        </>
      )}
      {scrollCueLabel && (
        <div className="hero-scroll-cue" aria-hidden="true">
          <span>{scrollCueLabel}</span>
          <ChevronDown size={18} />
        </div>
      )}
    </section>
  );
}
