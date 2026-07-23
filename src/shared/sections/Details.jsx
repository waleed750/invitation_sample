import React from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";

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
 *   imageUrl         — venue illustration/photo (optional)
 *   dateLine         — human-readable date/time line (optional)
 *   addressLines     — address lines below venue (optional)
 *   mapLabel         — map link text (optional)
 */
export default function Details({
  title,
  subtitle,
  venue,
  startTime,
  endTime,
  mapUrl,
  ornateBadgeUrl,
  imageUrl,
  dateLine,
  addressLines,
  mapLabel = "Google Maps",
}) {
  return (
    <section className="details-section" aria-labelledby="details-title">
      <div className="section-inner" data-reveal>
        <h2 id="details-title">{title}</h2>
        {subtitle && <p className="section-kicker">{subtitle}</p>}
        <div className="badge-frame">
          {ornateBadgeUrl && <img className="badge-image" src={ornateBadgeUrl} alt="" aria-hidden="true" />}
          {imageUrl && <img className="details-image" src={imageUrl} alt="" aria-hidden="true" />}
          <div>
            <h3>{venue ? "Location" : title}</h3>
            <p className="venue-name">{venue}</p>
            {dateLine && (
              <p className="time-line">
                <CalendarDays size={16} aria-hidden="true" />
                {dateLine}
              </p>
            )}
            {startTime && endTime && (
              <p className="time-line">
                <Clock size={16} aria-hidden="true" />
                From {startTime} to {endTime}
              </p>
            )}
            {addressLines?.length ? (
              <div className="details-address">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">
          <MapPin size={17} aria-hidden="true" />
          {mapLabel}
        </a>
      </div>
    </section>
  );
}
