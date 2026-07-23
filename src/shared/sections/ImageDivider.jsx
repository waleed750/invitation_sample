import React from "react";

export default function ImageDivider({ imageUrl, alt = "", line = false }) {
  return (
    <div className={`image-divider ${line ? "image-divider--line" : ""}`} aria-hidden={alt ? undefined : "true"}>
      {line && <span />}
      {imageUrl && <img src={imageUrl} alt={alt} loading="lazy" />}
      {line && <span />}
    </div>
  );
}
