import React from "react";

/**
 * Welcome section — heading + body paragraph.
 *
 * Props:
 *   title  — section heading
 *   body   — paragraph text
 *   bgUrl  — background image (optional)
 */
export default function Welcome({ title, body, bgUrl }) {
  return (
    <section className="welcome-section" aria-labelledby="welcome-title">
      {bgUrl && <img className="welcome-bg" src={bgUrl} alt="" aria-hidden="true" />}
      <div className="section-inner narrow" data-reveal>
        <h2 id="welcome-title">{title}</h2>
        <p>{body}</p>
      </div>
    </section>
  );
}
