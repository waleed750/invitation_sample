import React from "react";

/**
 * Schedule section — heading, kicker, and ordered list of items.
 *
 * Props:
 *   title             — section heading
 *   subtitle          — kicker text below heading
 *   items             — array of { title, description } or
 *                       { title, subtitle, stops: [{ time, text }] }
 *   stops             — direct timeline stops [{ time, text }] (optional)
 *   alternate         — render timeline stops on alternating sides (optional)
 *   coupleDancingUrl  — decorative illustration/photo (optional)
 *   bgUrl             — background image (optional)
 */
export default function Schedule({ title, subtitle, items = [], stops, alternate, coupleDancingUrl, bgUrl }) {
  const timelineStops = stops?.length ? stops : null;

  function renderTimeline(list) {
    return (
      <ol className={`schedule-timeline ${alternate ? "schedule-timeline--alternate" : ""}`}>
        {list.map((stop, index) => (
          <li className="schedule-stop" key={`${stop.time || "stop"}-${stop.text}-${index}`}>
            {stop.time && <strong>{stop.time}</strong>}
            <span>{stop.text}</span>
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
        <h2 id="schedule-title">{title}</h2>
        {subtitle && <p className="section-kicker">{subtitle}</p>}
        {timelineStops ? (
          renderTimeline(timelineStops)
        ) : (
          <div className="schedule-list">
            {items.map((item) => (
              <article className="schedule-item" key={item.title}>
                <h3>{item.title}</h3>
                {item.subtitle && <p className="schedule-item-subtitle">{item.subtitle}</p>}
                {item.stops?.length ? renderTimeline(item.stops) : <p>{item.time || item.description}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
