import React, { useEffect, useRef } from "react";

/**
 * Tap-to-open poster intro with intro video + fade.
 *
 * Props (fully data-driven):
 *   posterUrl    — poster image src
 *   videoUrl     — intro video src
 *   tapLabel     — text on the tap prompt (e.g. "Tap to open")
 *   isOpen       — has the user tapped?
 *   isFinished   — has the intro video finished / faded?
 *   onStart      — called on first tap
 *   onFinished   — called when intro video ends or fallback fires
 */
export default function VideoOpenIntro({
  posterUrl,
  videoUrl,
  tapLabel,
  isOpen,
  isFinished,
  onStart,
  onFinished,
}) {
  const videoRef = useRef(null);

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
      <img className="intro-poster" src={posterUrl} alt="Invitation opening poster" />
      <video
        ref={videoRef}
        className="intro-video"
        src={videoUrl}
        muted
        playsInline
        preload="auto"
        onEnded={onFinished}
      />
      <span className="tap-label">{tapLabel}</span>
    </button>
  );
}
