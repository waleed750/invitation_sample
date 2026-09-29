/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import {Bidi} from "@/components/Bidi";
import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import React, { useState } from "react";
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
  const [status, setStatus] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const yesLabel = attendanceOptions?.yes ?? t("attendingYes");
  const noLabel = attendanceOptions?.no ?? t("attendingNo");

  function updateGuestCount(nextValue: string | number) {
    setGuestCount(Math.min(8, Math.max(1, Number(nextValue) || 1)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (eventOptions?.length && selectedEvents.length === 0) {
      setStatus(text(eventError ?? t("eventError")));
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
          <fieldset>
            <legend>{text(attendingLabel ?? t("attending"))}</legend>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="yes"
                required
              />
              {text(yesLabel)}
            </label>
            <label className="rsvp-radio">
              <input
                type="radio"
                name="attending"
                value="no"
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

          {guestCountMode === "stepper" ? (
            <label>
              {text(guestCountLabel ?? t("guestCount"))}
              <div className="guest-stepper">
                <button type="button" aria-label={t("decreaseGuests")} onClick={() => updateGuestCount(guestCount - 1)}>
                  -
                </button>
                <input
                  name="guestCount"
                  type="number"
                  min="1"
                  max="8"
                  value={guestCount}
                  onChange={(e) => updateGuestCount(e.target.value)}
                />
                <button type="button" aria-label={t("increaseGuests")} onClick={() => updateGuestCount(guestCount + 1)}>
                  +
                </button>
              </div>
            </label>
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
            {text(emailLabel ?? t("email"))}
            <Bidi><input dir="ltr" name="email" type="email" maxLength={120} placeholder={text(emailPlaceholder ?? t("emailPlaceholder"))} required /></Bidi>
          </label>

          {showDietaryField && (
            <label>
              {text(dietaryFieldLabel ?? t("dietary"))}
              <input name="dietaryRequirements" type="text" maxLength={180} placeholder={text(dietaryPlaceholder ?? t("dietaryPlaceholder"))} />
            </label>
          )}

          {childrenMode === "radios" ? (
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

          <button type="submit">
            <Send size={17} aria-hidden="true" />
            {text(submitLabel ?? t("sendRsvp"))}
          </button>
          {status ? <p className="form-status" role="status">{status}</p> : null}
        </form>
      </div>
      {bottomUrl && (
        <img className="rsvp-bottom-decoration" src={bottomUrl} alt="" aria-hidden="true" />
      )}
    </section>
  );
}
