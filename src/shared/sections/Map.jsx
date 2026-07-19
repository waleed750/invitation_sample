import React from "react";

/**
 * Embedded Google Map section — iframe.
 *
 * Props:
 *   title  — iframe title (accessibility)
 *   src    — iframe src URL
 */
export default function Map({ title, src }) {
  return (
    <section className="map-section" aria-label="Venue map">
      <div className="map-frame" data-reveal>
        <iframe
          title={title || "Venue map"}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
