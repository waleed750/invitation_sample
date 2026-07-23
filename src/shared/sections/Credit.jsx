import React from "react";

/**
 * Reusable credit footer section.
 * Renders "Made with love by [name]" with a clickable link to portfolio.
 *
 * @param {Object} props
 * @param {string} [props.name="Waleed Ashraf"] - Credit name
 * @param {string} [props.portfolioUrl="https://waleed-ashraf.vercel.app/"] - Portfolio URL
 * @param {string} [props.portfolioLabel="Portfolio"] - Link text
 * @param {string} [props.monogramUrl] - Optional monogram image URL
 * @param {string} [props.coupleNames] - Optional couple names above credit
 * @param {string} [props.eventDate] - Optional event date above credit
 */
export default function Credit({
  name = "Waleed Ashraf",
  portfolioUrl = "https://waleed-ashraf.vercel.app/",
  portfolioLabel = "Portfolio",
  monogramUrl,
  coupleNames,
  eventDate,
}) {
  return (
    <footer className="credit-section">
      <div className="section-inner">
        {(monogramUrl || coupleNames || eventDate) && (
          <div className="credit-closing">
            {monogramUrl && <img className="credit-monogram" src={monogramUrl} alt="" aria-hidden="true" />}
            {coupleNames && <p className="credit-couple">{coupleNames}</p>}
            {eventDate && <p className="credit-date">{eventDate}</p>}
          </div>
        )}
        <p className="credit-line">
          Made with love by <strong>{name}</strong>
        </p>
        <a
          href={portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="credit-link"
        >
          {portfolioLabel}
        </a>
      </div>
    </footer>
  );
}
