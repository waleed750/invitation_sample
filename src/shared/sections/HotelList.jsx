import React from "react";

/**
 * Hotel list section — recommended hotels with illustration, price, and note.
 *
 * Props:
 *   title    — section heading
 *   subtitle — kicker text (optional)
 *   hotels   — list of hotel cards
 */
export default function HotelList({ title, subtitle, hotels = [] }) {
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
