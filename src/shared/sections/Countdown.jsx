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
 *   date — ISO-8601 datetime string
 */
export default function Countdown({ date }) {
  const timeLeft = useCountdown(date);

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
