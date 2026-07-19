import React from "react";

/**
 * Hero section — couple names, headline, background video.
 *
 * Props:
 *   headline       — eyebrow text (e.g. "We're Getting Engaged")
 *   firstName      — first person's name
 *   secondName     — second person's name
 *   displayDate    — human-readable date
 *   heroVideoUrl   — background video src (optional)
 *   heroPosterUrl  — poster before video loads (optional)
 *   ctaLabel       — call-to-action text at bottom (optional)
 */
export default function Hero({ headline, firstName, secondName, displayDate, heroVideoUrl, heroPosterUrl, ctaLabel }) {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      {heroVideoUrl && (
        <video
          className="hero-video"
          src={heroVideoUrl}
          poster={heroPosterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <div className="hero-scrim" />
      <div className="hero-copy" data-reveal>
        <p className="eyebrow">{headline}</p>
        <h1 id="hero-title">
          {firstName} <span>&amp;</span> {secondName}
        </h1>
        <p className="date-line">{displayDate}</p>
        {ctaLabel && <p className="hero-cta">{ctaLabel}</p>}
      </div>
    </section>
  );
}
