/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React from "react";

export default function Credit({
  name = "Waleed Ashraf",
  portfolioUrl = "https://waleed-ashraf.vercel.app/",
  portfolioLabel,
  monogramUrl,
  coupleNames,
  eventDate,
  creditLabel,
}: SectionProps<"credit">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  return (
    <footer className="credit-section">
      <div className="section-inner">
        {(monogramUrl || coupleNames || eventDate) && (
          <div className="credit-closing">
            {monogramUrl && <img className="credit-monogram" src={monogramUrl} alt="" aria-hidden="true" />}
            {coupleNames && <p className="credit-couple">{text(coupleNames)}</p>}
            {eventDate && <p className="credit-date">{text(eventDate)}</p>}
          </div>
        )}
        <p className="credit-line">
          {text(creditLabel ?? t("madeWithLove"))} <strong>{text(name)}</strong>
        </p>
        <a
          href={portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="credit-link"
        >
          {text(portfolioLabel ?? t("portfolio"))}
        </a>
      </div>
    </footer>
  );
}
