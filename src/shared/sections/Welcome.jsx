import React from "react";

/**
 * Welcome section — heading + body paragraph.
 *
 * Props:
 *   title — section heading
 *   body  — paragraph text
 */
export default function Welcome({ title, body }) {
  return (
    <section className="welcome-section" aria-labelledby="welcome-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="welcome-title">{title}</h2>
        <p>{body}</p>
      </div>
    </section>
  );
}
