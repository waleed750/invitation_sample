import React from "react";

/**
 * Gifts & wishes section — title, body text, optional background image.
 *
 * Props:
 *   title   — section heading (e.g. "Gifts & Wishes")
 *   body    — description text
 *   bgUrl   — background image (optional)
 *   buttonLabel — CTA button text (optional)
 *   buttonUrl   — CTA link (optional)
 */
export default function Gifts({ title, body, bgUrl, buttonLabel, buttonUrl }) {
  return (
    <section className="gifts-section" aria-labelledby="gifts-title">
      {bgUrl && (
        <img className="gifts-bg" src={bgUrl} alt="" aria-hidden="true" />
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title">{title}</h2>
        <p>{body}</p>
        {buttonLabel && buttonUrl && (
          <a className="gifts-cta" href={buttonUrl} target="_blank" rel="noreferrer">
            {buttonLabel}
          </a>
        )}
      </div>
    </section>
  );
}
