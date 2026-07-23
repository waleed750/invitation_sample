import React, { useEffect, useMemo, useState } from "react";

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

function TimeBox({ value, label, pad = false }) {
  const shown = pad ? String(value).padStart(2, "0") : value;

  return (
    <div className="time-box">
      <strong>{shown}</strong>
      <span>{label}</span>
    </div>
  );
}

/**
 * Countdown section — live countdown to event date.
 *
 * Props:
 *   date           — ISO-8601 datetime string
 *   title          — heading override (default "Countdown")
 *   untilLabel     — subtitle below heading (optional)
 *   bgImage        — background image overlay (optional)
 *   overlayImage   — foreground decoration (optional)
 *   columnLeftUrl  — left decorative column image (optional)
 *   columnRightUrl — right decorative column image (optional)
 *   showYears      — show Years box (optional)
 *   showMonths     — show Months box (optional)
 *   showSeconds    — show Seconds box (default true)
 */
export default function Countdown({
  date,
  title,
  untilLabel,
  bgImage,
  overlayImage,
  columnLeftUrl,
  columnRightUrl,
  showYears,
  showMonths,
  showSeconds = true,
}) {
  const timeLeft = useCountdown(date);

  return (
    <section className="countdown-section" id="countdown" aria-labelledby="countdown-title">
      {bgImage && <img className="countdown-bg" src={bgImage} alt="" aria-hidden="true" />}
      {columnLeftUrl && <img className="countdown-column-left" src={columnLeftUrl} alt="" aria-hidden="true" />}
      {columnRightUrl && <img className="countdown-column-right" src={columnRightUrl} alt="" aria-hidden="true" />}
      <div className="countdown-panel">
        <div className="section-inner narrow" data-reveal>
          <h2 id="countdown-title">{title || "Countdown"}</h2>
          {untilLabel && <p className="countdown-until">{untilLabel}</p>}
          <div className="countdown-grid">
            {showMonths && <TimeBox value={timeLeft.days > 30 ? Math.floor(timeLeft.days / 30) : 0} label="Months" />}
            <TimeBox value={timeLeft.days} label="Days" />
            <TimeBox value={timeLeft.hours} label="Hours" pad />
            <TimeBox value={timeLeft.minutes} label="Minutes" pad />
            {showSeconds && <TimeBox value={timeLeft.seconds} label="Seconds" pad />}
          </div>
        </div>
      </div>
      {overlayImage && <img className="countdown-overlay" src={overlayImage} alt="" aria-hidden="true" />}
    </section>
  );
}
