/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import React from "react";

export default function Gallery({ title, images = [] }: SectionProps<"gallery">) {
  const text = useInvitationText();
  return (
    <section className="gallery-section" aria-labelledby={title ? "gallery-title" : undefined}>
      <div className="section-inner" data-reveal>
        {title && <h2 id="gallery-title">{text(title)}</h2>}
        <div className="gallery-grid">
          {images.map((image, index) => {
            const src = typeof image === "string" ? image : image.src;
            const alt = typeof image === "string" ? "" : text(image.alt);
            return <img className="gallery-image" src={src} alt={alt} key={`${src}-${index}`} loading="lazy" />;
          })}
        </div>
      </div>
    </section>
  );
}
