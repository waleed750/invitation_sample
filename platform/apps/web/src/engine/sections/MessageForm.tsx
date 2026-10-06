"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useInvitationActions} from "../InvitationActionsContext";
import {useTranslations} from "next-intl";
import React, { useState } from "react";
import { Send } from "lucide-react";

export default function MessageForm({ title, subtitle, nameFieldLabel, namePlaceholder, messageLabel, messagePlaceholder, submitLabel, successMessage }: SectionProps<"messageForm">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  const publicT = useTranslations("public.forms");
  const actions = useInvitationActions();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actions) {
      const form = event.currentTarget;
      const formData = new FormData(form);
      setSubmitting(true);
      setStatus(publicT("submitting"));
      try {
        const result = await actions.submitMessage({
          name: String(formData.get("guestName") ?? ""),
          text: String(formData.get("message") ?? ""),
          website: String(formData.get("website") ?? "") || undefined,
        });
        if (!result.ok) {
          setStatus(publicT("error"));
          return;
        }
        form.reset();
        setStatus(text(successMessage ?? t("messageSuccess")));
      } catch {
        setStatus(publicT("error"));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    event.currentTarget.reset();
    setStatus(text(successMessage ?? t("messageSuccess")));
  }

  return (
    <section className="message-section" aria-labelledby="message-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="message-title">{text(title)}</h2>
        <p className="section-kicker">{text(subtitle)}</p>
        <form className="message-form" onSubmit={handleSubmit}>
          <label hidden aria-hidden="true">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
          <label>
            {text(nameFieldLabel ?? t("guestNames"))}
            <input name="guestName" type="text" maxLength={100} placeholder={text(namePlaceholder ?? t("yourName"))} required />
          </label>
          <label>
            {text(messageLabel ?? t("yourMessage"))}
            <textarea name="message" maxLength={1000} rows={4} placeholder={text(messagePlaceholder ?? t("messagePlaceholder"))} required />
          </label>
          <button type="submit" disabled={submitting}>
            <Send size={17} aria-hidden="true" />
            {submitting ? publicT("submitting") : text(submitLabel ?? t("sendMessage"))}
          </button>
          {status ? <p className="form-status" role="status">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}
