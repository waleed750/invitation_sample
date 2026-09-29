/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import React from "react";

export default function ImageDivider({ imageUrl, alt = "", line = false }: SectionProps<"imageDivider">) {
  const text = useInvitationText();
  return (
    <div className={`image-divider ${line ? "image-divider--line" : ""}`} aria-hidden={alt ? undefined : "true"}>
      {line && <span />}
      {imageUrl && <img src={imageUrl} alt={text(alt)} loading="lazy" />}
      {line && <span />}
    </div>
  );
}
