import React from "react";

/**
 * Welcome section — heading + body paragraph.
 *
 * Props:
 *   title  — section heading
 *   body   — paragraph text
 *   bgUrl  — background image (optional)
 *   cards  — illustrated event cards (optional)
 *   kicker — small heading above title (optional)
 *   sectionId — section DOM id (optional)
 */
export default function Welcome({ title, body, bgUrl, cards, kicker, sectionId }) {
  return (
    <section className="welcome-section" id={sectionId} aria-labelledby="welcome-title">
      {bgUrl && <img className="welcome-bg" src={bgUrl} alt="" aria-hidden="true" />}
      <div className="section-inner narrow" data-reveal>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2 id="welcome-title">{title}</h2>
        {cards?.length ? (
          <>
            {body && <p>{body}</p>}
            <div className="event-card-list">
              {cards.map((card) => (
                <article className="event-card" key={`${card.kicker}-${card.heading}`}>
                  {card.imageUrl && <img className="event-card-image" src={card.imageUrl} alt="" aria-hidden="true" />}
                  {card.kicker && <p className="event-card-kicker">{card.kicker}</p>}
                  {card.heading && <h3>{card.heading}</h3>}
                  {card.body && <p className="event-card-body">{card.body}</p>}
                  {(card.date || card.time) && <div className="event-card-divider" aria-hidden="true" />}
                  {card.date && <p className="event-card-date">{card.date}</p>}
                  {card.time && <p className="event-card-time">{card.time}</p>}
                  {card.mapUrl && (
                    <a className="event-card-link" href={card.mapUrl} target="_blank" rel="noreferrer">
                      View on map
                    </a>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : (
          <p>{body}</p>
        )}
      </div>
    </section>
  );
}
