"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React, { useState } from "react";
import { Send } from "lucide-react";

export default function MessageForm({ title, subtitle, nameFieldLabel, namePlaceholder, messageLabel, messagePlaceholder, submitLabel, successMessage }: SectionProps<"messageForm">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  const [status, setStatus] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus(text(successMessage ?? t("messageSuccess")));
  }

  return (
    <section className="message-section" aria-labelledby="message-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="message-title">{text(title)}</h2>
        <p className="section-kicker">{text(subtitle)}</p>
        <form className="message-form" onSubmit={handleSubmit}>
          <label>
            {text(nameFieldLabel ?? t("guestNames"))}
            <input name="guestName" type="text" maxLength={100} placeholder={text(namePlaceholder ?? t("yourName"))} required />
          </label>
          <label>
            {text(messageLabel ?? t("yourMessage"))}
            <textarea name="message" maxLength={1000} rows={4} placeholder={text(messagePlaceholder ?? t("messagePlaceholder"))} required />
          </label>
          <button type="submit">
            <Send size={17} aria-hidden="true" />
            {text(submitLabel ?? t("sendMessage"))}
          </button>
          {status ? <p className="form-status" role="status">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}
