/* eslint-disable @next/next/no-img-element -- Template assets retain intrinsic sizing and CSS cropping. */
"use client";

import type {SectionProps} from "../types";
import {useInvitationText} from "../InvitationLocaleContext";
import {useTranslations} from "next-intl";
import {Bidi} from "@/components/Bidi";
import React from "react";

export default function Gifts({ title, body, bgUrl, buttonLabel, buttonUrl, bankAccounts }: SectionProps<"gifts">) {
  const text = useInvitationText();
  const t = useTranslations("engine");
  return (
    <section className="gifts-section" aria-labelledby="gifts-title">
      {bgUrl && (
        <img className="gifts-bg" src={bgUrl} alt="" aria-hidden="true" />
      )}
      <div className="section-inner narrow" data-reveal>
        <h2 id="gifts-title">{text(title)}</h2>
        <p>{text(body)}</p>
        {bankAccounts?.length ? (
          <div className="bank-account-list">
            {bankAccounts.map((account) => (
              <article className="bank-account-card" key={`${text(account.bankLabel)}-${text(account.accountName)}`}>
                <h3>{text(account.bankLabel)}</h3>
                <p>{text(account.accountName)}</p>
                <dl>
                  <div>
                    <dt>{t("iban")}</dt>
                    <dd><Bidi>{text(account.iban)}</Bidi></dd>
                  </div>
                  <div>
                    <dt>{t("bic")}</dt>
                    <dd><Bidi>{text(account.bic)}</Bidi></dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : null}
        {buttonLabel && buttonUrl && (
          <a className="gifts-cta" href={buttonUrl} target="_blank" rel="noreferrer">
            {text(buttonLabel)}
          </a>
        )}
      </div>
    </section>
  );
}
