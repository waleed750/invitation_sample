import React from "react";

/**
 * Hotel list section — recommended hotels with illustration, price, and note.
 *
 * Props:
 *   title    — section heading
 *   subtitle — kicker text (optional)
 *   hotels   — list of hotel cards
 *   closingNote — italic note after hotel cards (optional)
 */
export default function HotelList({ title, subtitle, hotels = [], closingNote }) {
  return (
    <section className="hotel-list-section" aria-labelledby="hotel-list-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="hotel-list-title">{title}</h2>
        {subtitle && <p className="section-kicker">{subtitle}</p>}
        <div className="hotel-list">
          {hotels.map((hotel) => (
            <article className="hotel-card" key={hotel.name}>
              {hotel.imageUrl && <img className="hotel-card-image" src={hotel.imageUrl} alt="" aria-hidden="true" />}
              <div className="hotel-card-copy">
                <h3>{hotel.name}</h3>
                {hotel.pricePerNight && <p className="hotel-price">{hotel.pricePerNight}</p>}
                {hotel.priceNote && <p className="hotel-note">{hotel.priceNote}</p>}
                {hotel.bookingNote && <p className="hotel-booking">{hotel.bookingNote}</p>}
                {(hotel.city || hotel.distanceNote) && (
                  <p className="hotel-location">
                    {[hotel.city, hotel.distanceNote].filter(Boolean).join(" · ")}
                  </p>
                )}
                {hotel.phone && <p className="hotel-contact">{hotel.phone}</p>}
                {hotel.email && <p className="hotel-contact">{hotel.email}</p>}
                {hotel.promoCode && <p className="hotel-promo">Promo Code: {hotel.promoCode}</p>}
                {hotel.websiteUrl && (
                  <a className="hotel-website" href={hotel.websiteUrl} target="_blank" rel="noreferrer">
                    Visit Website
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {closingNote && <p className="hotel-closing-note">{closingNote}</p>}
      </div>
    </section>
  );
}
