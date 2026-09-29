"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Faq({ title, items }: SectionProps<"faq">) {
  const text = useInvitationText();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="faq-title">{text(title)}</h2>
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
                  <span>{text(item.question)}</span>
                  {isOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                </button>
                {isOpen && <div className="faq-answer"><p>{text(item.answer)}</p></div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
