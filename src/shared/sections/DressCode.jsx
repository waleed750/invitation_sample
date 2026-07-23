import React from "react";

/**
 * Dress code section — title, body text, optional illustration.
 *
 * Props:
 *   title          — section heading (e.g. "Dress Code")
 *   body           — description text
 *   illustrationUrl — decorative illustration (optional)
 *   cards          — illustrated dress-code cards (optional)
 *   groups         — flat attire groups [{ heading, body }] (optional)
 */
export default function DressCode({ title, body, illustrationUrl, cards, groups }) {
  return (
    <section className="dresscode-section" aria-labelledby="dresscode-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="dresscode-title">{title}</h2>
        {cards?.length ? (
          <div className="dresscode-card-list">
            {cards.map((card) => (
              <article className="dresscode-card" key={`${card.heading}-${card.date}`}>
                {card.imageUrl && <img className="dresscode-card-image" src={card.imageUrl} alt="" aria-hidden="true" />}
                {card.heading && <h3>{card.heading}</h3>}
                {card.date && <p className="dresscode-date">{card.date}</p>}
                {card.attire && <p className="dresscode-attire">{card.attire}</p>}
              </article>
            ))}
          </div>
        ) : groups?.length ? (
          <div className="dresscode-group-list">
            {groups.map((group) => (
              <article className="dresscode-group" key={group.heading}>
                <h3>{group.heading}</h3>
                <p>{group.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>{body}</p>
        )}
        {illustrationUrl && (
          <img className="dresscode-illustration" src={illustrationUrl} alt="" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
