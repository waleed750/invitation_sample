"use client";

import {InvitationPlaybackContext} from "../InvitationPlaybackContext";
import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

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
}: SectionProps<"hero">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const {contentVisible} = useContext(InvitationPlaybackContext);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !contentVisible) return;
    video.currentTime = 0;
    void video.play().catch(() => {});
    return () => video.pause();
  }, [contentVisible, heroVideoUrl]);

  function handleVideoTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement>) {
    if (overlayFadeOutAt !== undefined) {
      setOverlayHidden(event.currentTarget.currentTime >= overlayFadeOutAt);
    }
  }

  return (
    <section
      className="hero-section"
      aria-labelledby={firstName || secondName ? "hero-title" : undefined}
      aria-label={firstName || secondName ? undefined : t("invitation")}
    >
      {heroVideoUrl && (
        <video
          ref={videoRef}
          className="hero-video"
          src={heroVideoUrl}
          poster={heroPosterUrl}
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
            {headline && <p className="eyebrow">{text(headline)}</p>}
            {(firstName || secondName) && (
              <h1 id="hero-title">
                {firstName && <span className="hero-name-line">{text(firstName)}</span>}
                <span className="hero-amp">&amp;</span>
                {secondName && <span className="hero-name-line">{text(secondName)}</span>}
              </h1>
            )}
            {displayDate && <p className="date-line">{text(displayDate)}</p>}
            {ctaLabel && <p className="hero-cta">{text(ctaLabel)}</p>}
          </div>
        </>
      )}
      {scrollCueLabel && (
        <div className="hero-scroll-cue" aria-hidden="true">
          <span>{text(scrollCueLabel)}</span>
          <ChevronDown size={18} />
        </div>
      )}
    </section>
  );
}
