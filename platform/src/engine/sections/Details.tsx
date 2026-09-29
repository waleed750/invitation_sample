/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";

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
  mapLabel,
  locationLabel,
}: SectionProps<"details">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  return (
    <section className="details-section" aria-labelledby="details-title">
      <div className="section-inner" data-reveal>
        <h2 id="details-title">{text(title)}</h2>
        {subtitle && <p className="section-kicker">{text(subtitle)}</p>}
        <div className="badge-frame">
          {ornateBadgeUrl && <img className="badge-image" src={ornateBadgeUrl} alt="" aria-hidden="true" />}
          {imageUrl && <img className="details-image" src={imageUrl} alt="" aria-hidden="true" />}
          <div>
            <h3>{venue ? text(locationLabel ?? t("location")) : text(title)}</h3>
            <p className="venue-name">{text(venue)}</p>
            {dateLine && (
              <p className="time-line">
                <CalendarDays size={16} aria-hidden="true" />
                {text(dateLine)}
              </p>
            )}
            {startTime && endTime && (
              <p className="time-line">
                <Clock size={16} aria-hidden="true" />
                {t("timeRange", {start: text(startTime), end: text(endTime)})}
              </p>
            )}
            {addressLines?.length ? (
              <div className="details-address">
                {addressLines.map((line) => (
                  <p key={text(line)}>{text(line)}</p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">
          <MapPin size={17} aria-hidden="true" />
          {text(mapLabel ?? t("maps"))}
        </a>
      </div>
    </section>
  );
}
