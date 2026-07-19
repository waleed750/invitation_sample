import React from "react";

/**
 * Dress code section — title, body text, optional illustration.
 *
 * Props:
 *   title          — section heading (e.g. "Dress Code")
 *   body           — description text
 *   illustrationUrl — decorative illustration (optional)
 */
export default function DressCode({ title, body, illustrationUrl }) {
  return (
    <section className="dresscode-section" aria-labelledby="dresscode-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="dresscode-title">{title}</h2>
        <p>{body}</p>
        {illustrationUrl && (
          <img className="dresscode-illustration" src={illustrationUrl} alt="" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
