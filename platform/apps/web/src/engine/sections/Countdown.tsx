/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import {getTimeLeft} from "../countdown";
import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

function useCountdown(date: string) {
  const target = useMemo(() => new Date(date).getTime(), [date]);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | null>(null);
  useEffect(() => {
    setTimeLeft(getTimeLeft(target, Date.now()));
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft(target, Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  return timeLeft;
}

function TimeBox({value, label, pad = false}: {value?: number; label: string; pad?: boolean}) {
  const shown = value === undefined ? '—' : pad ? String(value).padStart(2, '0') : value;
  return <div className="time-box"><strong>{shown}</strong><span>{label}</span></div>;
}

export default function Countdown({
  date,
  title,
  untilLabel,
  bgImage,
  overlayImage,
  columnLeftUrl,
  columnRightUrl,
  showMonths,
  showSeconds = true,
  kicker,
  labels,
}: SectionProps<"countdown">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  const timeLeft = useCountdown(date);

  return (
    <section className="countdown-section" id="countdown" aria-labelledby="countdown-title">
      {bgImage && <img className="countdown-bg" src={bgImage} alt="" aria-hidden="true" />}
      {columnLeftUrl && <img className="countdown-column-left" src={columnLeftUrl} alt="" aria-hidden="true" />}
      {columnRightUrl && <img className="countdown-column-right" src={columnRightUrl} alt="" aria-hidden="true" />}
      <div className="countdown-panel">
        <div className="section-inner narrow" data-reveal>
          {kicker && <p className="countdown-kicker">{text(kicker)}</p>}
          <h2 id="countdown-title">{text(title ?? t("countdown"))}</h2>
          {untilLabel && <p className="countdown-until">{text(untilLabel)}</p>}
          <div className="countdown-grid">
            {showMonths && <TimeBox value={timeLeft ? (timeLeft.days > 30 ? Math.floor(timeLeft.days / 30) : 0) : undefined} label={text(labels?.months ?? t("months"))} />}
            <TimeBox value={timeLeft?.days} label={text(labels?.days ?? t("days"))} />
            <TimeBox value={timeLeft?.hours} label={text(labels?.hours ?? t("hours"))} pad />
            <TimeBox value={timeLeft?.minutes} label={text(labels?.minutes ?? t("minutes"))} pad />
            {showSeconds && <TimeBox value={timeLeft?.seconds} label={text(labels?.seconds ?? t("seconds"))} pad />}
          </div>
        </div>
      </div>
      {overlayImage && <img className="countdown-overlay" src={overlayImage} alt="" aria-hidden="true" />}
    </section>
  );
}
