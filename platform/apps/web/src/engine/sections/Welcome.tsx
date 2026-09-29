/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React from "react";

export default function Welcome({ title, body, bgUrl, cards, kicker, sectionId }: SectionProps<"welcome">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  return (
    <section className="welcome-section" id={sectionId} aria-labelledby="welcome-title">
      {bgUrl && <img className="welcome-bg" src={bgUrl} alt="" aria-hidden="true" />}
      <div className="section-inner narrow" data-reveal>
        {kicker && <p className="section-kicker">{text(kicker)}</p>}
        <h2 id="welcome-title">{text(title)}</h2>
        {cards?.length ? (
          <>
            {body && <p>{text(body)}</p>}
            <div className="event-card-list">
              {cards.map((card) => (
                <article className="event-card" key={`${text(card.kicker)}-${text(card.heading)}`}>
                  {card.imageUrl && <img className="event-card-image" src={card.imageUrl} alt="" aria-hidden="true" />}
                  {card.kicker && <p className="event-card-kicker">{text(card.kicker)}</p>}
                  {card.heading && <h3>{text(card.heading)}</h3>}
                  {card.body && <p className="event-card-body">{text(card.body)}</p>}
                  {(card.date || card.time) && <div className="event-card-divider" aria-hidden="true" />}
                  {card.date && <p className="event-card-date">{text(card.date)}</p>}
                  {card.time && <p className="event-card-time">{text(card.time)}</p>}
                  {card.mapUrl && (
                    <a className="event-card-link" href={card.mapUrl} target="_blank" rel="noreferrer">
                      {text(card.mapLabel ?? t("viewMap"))}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : (
          <p>{text(body)}</p>
        )}
      </div>
    </section>
  );
}
