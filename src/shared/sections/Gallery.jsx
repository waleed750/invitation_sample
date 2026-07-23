import React from "react";

/**
 * Gallery section — responsive image grid, no lightbox.
 *
 * Props:
 *   title  — optional heading
 *   images — array of image URLs or { src, alt }
 */
export default function Gallery({ title, images = [] }) {
  return (
    <section className="gallery-section" aria-labelledby={title ? "gallery-title" : undefined}>
      <div className="section-inner" data-reveal>
        {title && <h2 id="gallery-title">{title}</h2>}
        <div className="gallery-grid">
          {images.map((image, index) => {
            const src = typeof image === "string" ? image : image.src;
            const alt = typeof image === "string" ? "" : image.alt || "";
            return <img className="gallery-image" src={src} alt={alt} key={`${src}-${index}`} loading="lazy" />;
          })}
        </div>
      </div>
    </section>
  );
}
