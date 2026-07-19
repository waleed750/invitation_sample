import React from "react";
import { Clock, MapPin } from "lucide-react";

/**
 * Venue details section — heading, venue name, time range, map link.
 *
 * Props:
 *   title           — section heading
 *   subtitle        — kicker text
 *   venue           — venue name
 *   startTime       — e.g. "8 PM"
 *   endTime         — e.g. "12 AM"
 *   mapUrl          — Google Maps link
 *   ornateBadgeUrl  — badge/crest image (optional)
 */
export default function Details({ title, subtitle, venue, startTime, endTime, mapUrl, ornateBadgeUrl }) {
  return (
    <section className="details-section" aria-labelledby="details-title">
      <div className="section-inner" data-reveal>
        <h2 id="details-title">{title}</h2>
        <p className="section-kicker">{subtitle}</p>
        <div className="badge-frame">
          {ornateBadgeUrl && <img src={ornateBadgeUrl} alt="" aria-hidden="true" />}
          <div>
            <h3>Location</h3>
            <p className="venue-name">{venue}</p>
            <p className="time-line">
              <Clock size={16} aria-hidden="true" />
              From {startTime} to {endTime}
            </p>
          </div>
        </div>
        <a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">
          <MapPin size={17} aria-hidden="true" />
          Google Maps
        </a>
      </div>
    </section>
  );
}
