/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import React from "react";

export default function DressCode({ title, body, illustrationUrl, cards, groups }: SectionProps<"dressCode">) {
  const text = useInvitationText();
  return (
    <section className="dresscode-section" aria-labelledby="dresscode-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="dresscode-title">{text(title)}</h2>
        {cards?.length ? (
          <div className="dresscode-card-list">
            {cards.map((card) => (
              <article className="dresscode-card" key={`${text(card.heading)}-${text(card.date)}`}>
                {card.imageUrl && <img className="dresscode-card-image" src={card.imageUrl} alt="" aria-hidden="true" />}
                {card.heading && <h3>{text(card.heading)}</h3>}
                {card.date && <p className="dresscode-date">{text(card.date)}</p>}
                {card.attire && <p className="dresscode-attire">{text(card.attire)}</p>}
              </article>
            ))}
          </div>
        ) : groups?.length ? (
          <div className="dresscode-group-list">
            {groups.map((group) => (
              <article className="dresscode-group" key={text(group.heading)}>
                <h3>{text(group.heading)}</h3>
                <p>{text(group.body)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>{text(body)}</p>
        )}
        {illustrationUrl && (
          <img className="dresscode-illustration" src={illustrationUrl} alt="" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
