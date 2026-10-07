/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import {Bidi} from "@/components/Bidi";
import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useInvitationActions} from "../InvitationActionsContext";
import {useTranslations} from "next-intl";
import React, { useEffect, useId, useRef, useState } from "react";
import { Send } from "lucide-react";

export default function Rsvp({
  title,
  subtitle,
  bgUrl,
  bottomUrl,
  attendanceOptions,
  eventOptions,
  guestCountMode = "select",
  nameFieldLabel,
  childrenMode = "checkbox",
  childrenLabel,
  showDietaryField,
  dietaryFieldLabel,
  dietaryPlaceholder,
  submitLabel,
  namePlaceholder, successMessage, attendingLabel, eventsLabel, guestCountLabel,
  emailLabel, emailPlaceholder, eventError,
}: SectionProps<"rsvp">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  const publicT = useTranslations("public.forms");
  const actions = useInvitationActions();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const stepperId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const declining = attending === "no";
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const yesLabel = attendanceOptions?.yes ?? t("attendingYes");
  const noLabel = attendanceOptions?.no ?? t("attendingNo");

  useEffect(() => {
    if (status) statusRef.current?.scrollIntoView({ block: "nearest" });
  }, [status]);

  function updateGuestCount(nextValue: string | number) {
    setGuestCount(Math.min(8, Math.max(1, Number(nextValue) || 1)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (eventOptions?.length && selectedEvents.length === 0) {
      setStatus(text(eventError ?? t("eventError")));
      return;
    }
    if (actions) {
      const form = event.currentTarget;
      const formData = new FormData(form);
      setSubmitting(true);
      setStatus(publicT("submitting"));
      try {
        const result = await actions.submitRsvp({
          name: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? "") || undefined,
          attending: formData.get("attending") === "yes",
          guests: guestCount,
          note: String(formData.get("dietaryRequirements") ?? "") || undefined,
          website: String(formData.get("website") ?? "") || undefined,
        });
        if (!result.ok) {
          setStatus(publicT(result.code === "limit_reached" ? "limitReached" : "error"));
          return;
        }
        setStatus(text(successMessage ?? t("rsvpSuccess")));
        form.reset();
        setGuestCount(1);
        setSelectedEvents([]);
      } catch {
        setStatus(publicT("error"));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStatus(text(successMessage ?? t("rsvpSuccess")));
  }

  function toggleEvent(value: string) {
    setSelectedEvents((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <section className="rsvp-section" aria-labelledby="rsvp-title">
      {bgUrl && (
        <img className="rsvp-decoration" src={bgUrl} alt="" aria-hidden="true" />
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="rsvp-title">{text(title)}</h2>
        <p className="section-kicker">{text(subtitle)}</p>
        <form className="rsvp-form" onSubmit={handleSubmit}>
          <label hidden aria-hidden="true">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
          <fieldset>
            <legend>{text(attendingLabel ?? t("attending"))}</legend>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="yes"
                required
                onChange={() => setAttending("yes")}
              />
              {text(yesLabel)}
            </label>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="no"
                onChange={() => { setAttending("no"); setGuestCount(1); }}
              />
              {text(noLabel)}
            </label>
          </fieldset>

          {eventOptions?.length ? (
            <fieldset>
              <legend>{text(eventsLabel ?? t("events"))}</legend>
              {eventOptions.map((option, index) => (
                <label className="rsvp-checkbox" key={option.value ?? text(option.label)}>
                  <input
                    type="checkbox"
                    name="events"
                    value={option.value ?? text(option.label)}
                    checked={selectedEvents.includes(option.value ?? text(option.label))}
                    aria-required={index === 0 ? "true" : undefined}
                    onChange={() => toggleEvent(option.value ?? text(option.label))}
                  />
                  {text(option.label)}
                </label>
              ))}
            </fieldset>
          ) : null}

          <label>
            {text(nameFieldLabel ?? t("fullName"))}
            <input name="fullName" type="text" maxLength={100} placeholder={text(namePlaceholder ?? t("enterName"))} required />
          </label>

          {declining ? null : guestCountMode === "stepper" ? (
            <div className="rsvp-field">
              <label htmlFor={stepperId}>{text(guestCountLabel ?? t("guestCount"))}</label>
              <div className="guest-stepper">
                <button type="button" aria-label={t("decreaseGuests")} disabled={guestCount <= 1} onClick={() => updateGuestCount(guestCount - 1)}>
                  −
                </button>
                <input
                  id={stepperId}
                  name="guestCount"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="8"
                  value={guestCount}
                  onChange={(e) => updateGuestCount(e.target.value)}
                />
                <button type="button" aria-label={t("increaseGuests")} disabled={guestCount >= 8} onClick={() => updateGuestCount(guestCount + 1)}>
                  +
                </button>
              </div>
            </div>
          ) : (
            <label>
              {text(guestCountLabel ?? t("guestCount"))}
              <select name="guestCount" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            {t("phone")}
            <Bidi><input dir="ltr" name="phone" type="tel" maxLength={40} placeholder={t("phonePlaceholder")} /></Bidi>
          </label>

          <label>
            {text(emailLabel ?? t("email"))}
            <Bidi><input dir="ltr" name="email" type="email" maxLength={120} placeholder={text(emailPlaceholder ?? t("emailPlaceholder"))} /></Bidi>
          </label>

          {showDietaryField && !declining && (
            <label>
              {text(dietaryFieldLabel ?? t("dietary"))}
              <input name="dietaryRequirements" type="text" maxLength={180} placeholder={text(dietaryPlaceholder ?? t("dietaryPlaceholder"))} />
            </label>
          )}

          {declining ? null : childrenMode === "radios" ? (
            <fieldset>
              <legend>{text(childrenLabel ?? t("children"))}</legend>
              <label className="rsvp-radio">
                <input type="radio" name="children" value="yes" />
                {t("yes")}
              </label>
              <label className="rsvp-radio">
                <input type="radio" name="children" value="no" />
                {t("no")}
              </label>
            </fieldset>
          ) : (
            <label className="rsvp-checkbox">
              <input type="checkbox" name="children" />
              {text(childrenLabel ?? t("children"))}
            </label>
          )}

          <button type="submit" disabled={submitting}>
            <Send size={17} aria-hidden="true" />
            {submitting ? publicT("submitting") : text(submitLabel ?? t("sendRsvp"))}
          </button>
          {status ? <p className="form-status" role="status" ref={statusRef}>{status}</p> : null}
        </form>
      </div>
      {bottomUrl && (
        <img className="rsvp-bottom-decoration" src={bottomUrl} alt="" aria-hidden="true" />
      )}
    </section>
  );
}
