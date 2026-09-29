/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import {Bidi} from "@/components/Bidi";
import React from "react";

export default function HotelList({ title, subtitle, hotels = [], closingNote }: SectionProps<"hotelList">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  return (
    <section className="hotel-list-section" aria-labelledby="hotel-list-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="hotel-list-title">{text(title)}</h2>
        {subtitle && <p className="section-kicker">{text(subtitle)}</p>}
        <div className="hotel-list">
          {hotels.map((hotel) => (
            <article className="hotel-card" key={text(hotel.name)}>
              {hotel.imageUrl && <img className="hotel-card-image" src={hotel.imageUrl} alt="" aria-hidden="true" />}
              <div className="hotel-card-copy">
                <h3>{text(hotel.name)}</h3>
                {hotel.pricePerNight && <p className="hotel-price">{text(hotel.pricePerNight)}</p>}
                {hotel.priceNote && <p className="hotel-note">{text(hotel.priceNote)}</p>}
                {hotel.bookingNote && <p className="hotel-booking">{text(hotel.bookingNote)}</p>}
                {(hotel.city || hotel.distanceNote) && (
                  <p className="hotel-location">
                    {[text(hotel.city), text(hotel.distanceNote)].filter(Boolean).join(" · ")}
                  </p>
                )}
                {hotel.phone && <p className="hotel-contact"><Bidi>{text(hotel.phone)}</Bidi></p>}
                {hotel.email && <p className="hotel-contact"><Bidi>{text(hotel.email)}</Bidi></p>}
                {hotel.promoCode && <p className="hotel-promo">{t("promoCode")}: <Bidi>{text(hotel.promoCode)}</Bidi></p>}
                {hotel.websiteUrl && (
                  <a className="hotel-website" href={hotel.websiteUrl} target="_blank" rel="noreferrer">
                    {text(hotel.websiteLabel ?? t("website"))}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {closingNote && <p className="hotel-closing-note">{text(closingNote)}</p>}
      </div>
    </section>
  );
}
