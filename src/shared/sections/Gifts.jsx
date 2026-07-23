import React from "react";

/**
 * Gifts & wishes section — title, body text, optional background image.
 *
 * Props:
 *   title   — section heading (e.g. "Gifts & Wishes")
 *   body    — description text
 *   bgUrl   — background image (optional)
 *   buttonLabel — CTA button text (optional)
 *   buttonUrl   — CTA link (optional)
 *   bankAccounts — bank-account cards (optional)
 */
export default function Gifts({ title, body, bgUrl, buttonLabel, buttonUrl, bankAccounts }) {
  return (
    <section className="gifts-section" aria-labelledby="gifts-title">
      {bgUrl && (
        <img className="gifts-bg" src={bgUrl} alt="" aria-hidden="true" />
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title">{title}</h2>
        <p>{body}</p>
        {bankAccounts?.length ? (
          <div className="bank-account-list">
            {bankAccounts.map((account) => (
              <article className="bank-account-card" key={`${account.bankLabel}-${account.accountName}`}>
                <h3>{account.bankLabel}</h3>
                <p>{account.accountName}</p>
                <dl>
                  <div>
                    <dt>IBAN</dt>
                    <dd>{account.iban}</dd>
                  </div>
                  <div>
                    <dt>BIC/SWIFT</dt>
                    <dd>{account.bic}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : null}
        {buttonLabel && buttonUrl && (
          <a className="gifts-cta" href={buttonUrl} target="_blank" rel="noreferrer">
            {buttonLabel}
          </a>
        )}
      </div>
    </section>
  );
}
