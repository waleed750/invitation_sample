import React from "react";

/**
 * Story / memory-lane section — chaptered narrative with scrolling photo strips.
 *
 * Props:
 *   title       — section heading (e.g. "A trip down memory lane")
 *   chapters    — array of { quote, prose, photos: string[] }
 *   birdsFrame1 — first animated-birds image URL (optional)
 *   birdsFrame2 — second animated-birds image URL (optional, swap animation)
 */
export default function Story({ title, chapters, birdsFrame1, birdsFrame2 }) {
  return (
    <section className="story-section" aria-labelledby="story-title">
      <div className="section-inner narrow" data-reveal>
        {(birdsFrame1 || birdsFrame2) && (
          <div className="story-birds" aria-hidden="true">
            {birdsFrame1 && <img className="story-birds__frame-a" src={birdsFrame1} alt="" />}
            {birdsFrame2 && <img className="story-birds__frame-b" src={birdsFrame2} alt="" />}
          </div>
        )}
        <h2 id="story-title">{title}</h2>
        <div className="story-chapters">
          {chapters.map((chapter, i) => (
            <article className="story-chapter" key={i}>
              {chapter.quote && <h3 className="story-chapter__quote">{chapter.quote}</h3>}
              <p className="story-chapter__prose">{chapter.prose}</p>
              {chapter.photos?.length > 0 && (
                <div className="story-strip">
                  <div className="story-strip__track">
                    {chapter.photos.map((src, j) => (
                      <button className="story-strip__item" type="button" key={j}>
                        <img src={src} alt="" draggable="false" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
