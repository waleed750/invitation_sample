import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * FAQ accordion section — expandable question/answer items.
 *
 * Props:
 *   title — section heading (e.g. "Frequently Asked Questions")
 *   items — array of { question, answer }
 */
export default function Faq({ title, items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="faq-title">{title}</h2>
        <div className="faq-list">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div className="faq-item" key={i}>
                <button
                  className="faq-question"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span>{item.question}</span>
                  {isOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                </button>
                {isOpen && <div className="faq-answer"><p>{item.answer}</p></div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
