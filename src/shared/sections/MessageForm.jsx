import React, { useState } from "react";
import { Send } from "lucide-react";

/**
 * Message/guestbook form section.
 *
 * Props:
 *   title    — section heading
 *   subtitle — kicker text
 */
export default function MessageForm({ title, subtitle }) {
  const [status, setStatus] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus("Your message is saved locally for this preview.");
  }

  return (
    <section className="message-section" aria-labelledby="message-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="message-title">{title}</h2>
        <p className="section-kicker">{subtitle}</p>
        <form className="message-form" onSubmit={handleSubmit}>
          <label>
            Guest Name(s)
            <input name="guestName" type="text" maxLength="100" placeholder="Your name" required />
          </label>
          <label>
            Your Message
            <textarea name="message" maxLength="1000" rows="4" placeholder="Write us a few words..." required />
          </label>
          <button type="submit">
            <Send size={17} aria-hidden="true" />
            Send Message
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}
