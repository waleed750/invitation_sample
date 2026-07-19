import React from "react";

/**
 * Schedule section — heading, kicker, and ordered list of items.
 *
 * Props:
 *   title             — section heading
 *   subtitle          — kicker text below heading
 *   items             — array of { title, description }
 *   coupleDancingUrl  — decorative illustration/photo (optional)
 *   bgUrl             — background image (optional)
 */
export default function Schedule({ title, subtitle, items, coupleDancingUrl, bgUrl }) {
  return (
    <section className="schedule-section" aria-labelledby="schedule-title">
      {coupleDancingUrl && (
        <img className="dancing-art" src={coupleDancingUrl} alt="" aria-hidden="true" />
      )}
      {bgUrl && <img className="schedule-bg" src={bgUrl} alt="" aria-hidden="true" />}
      <div className="section-inner" data-reveal>
        <h2 id="schedule-title">{title}</h2>
        {subtitle && <p className="section-kicker">{subtitle}</p>}
        <div className="schedule-list">
          {items.map((item) => (
            <article className="schedule-item" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.time || item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
