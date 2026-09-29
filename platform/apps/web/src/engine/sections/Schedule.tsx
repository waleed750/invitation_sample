/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import React from "react";

export default function Schedule({ title, subtitle, items = [], stops, alternate, coupleDancingUrl, bgUrl }: SectionProps<"schedule">) {
  const text = useInvitationText();
  const timelineStops = stops?.length ? stops : null;

  function renderTimeline(list: NonNullable<SectionProps<"schedule">["stops"]>) {
    return (
      <ol className={`schedule-timeline ${alternate ? "schedule-timeline--alternate" : ""}`}>
        {list.map((stop, index) => (
          <li className="schedule-stop" key={`${text(stop.time) || "stop"}-${text(stop.text)}-${index}`}>
            {stop.time && <strong>{text(stop.time)}</strong>}
            <span>{text(stop.text)}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section className="schedule-section" aria-labelledby="schedule-title">
      {coupleDancingUrl && (
        <img className="dancing-art" src={coupleDancingUrl} alt="" aria-hidden="true" />
      )}
      {bgUrl && <img className="schedule-bg" src={bgUrl} alt="" aria-hidden="true" />}
      <div className="section-inner" data-reveal>
        <h2 id="schedule-title">{text(title)}</h2>
        {subtitle && <p className="section-kicker">{text(subtitle)}</p>}
        {timelineStops ? (
          renderTimeline(timelineStops)
        ) : (
          <div className="schedule-list">
            {items.map((item) => (
              <article className="schedule-item" key={text(item.title)}>
                <h3>{text(item.title)}</h3>
                {item.subtitle && <p className="schedule-item-subtitle">{text(item.subtitle)}</p>}
                {item.stops?.length ? renderTimeline(item.stops) : <p>{text(item.time ?? item.description)}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
