"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React from "react";

export default function Map({ title, src }: SectionProps<"map">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  return (
    <section className="map-section" aria-label={text(title ?? t("venueMap"))}>
      <div className="map-frame" data-reveal>
        <iframe
          title={text(title ?? t("venueMap"))}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
