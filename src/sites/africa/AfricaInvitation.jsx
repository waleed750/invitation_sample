import React from "react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Welcome from "../../shared/sections/Welcome.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import Story from "../../shared/sections/Story.jsx";
import DressCode from "../../shared/sections/DressCode.jsx";
import Gifts from "../../shared/sections/Gifts.jsx";
import Rsvp from "../../shared/sections/Rsvp.jsx";
import Faq from "../../shared/sections/Faq.jsx";
import "./styles.css";

function AfricaFooter({ names, date, creditLine, creditName, frameUrl }) {
  return (
    <footer className="africa-footer">
      {frameUrl && <img className="africa-footer__frame" src={frameUrl} alt="" aria-hidden="true" />}
      <div className="africa-footer__copy">
        {names && <strong>{names}</strong>}
        {date && <span>{date}</span>}
        {creditLine && (
          <p className="africa-footer__credit">
            {creditLine} {creditName}
          </p>
        )}
      </div>
    </footer>
  );
}

const sectionComponents = {
  hero: Hero,
  countdown: Countdown,
  welcome: Welcome,
  schedule: Schedule,
  story: Story,
  dressCode: DressCode,
  gifts: Gifts,
  rsvp: Rsvp,
  faq: Faq,
  footer: AfricaFooter,
};

export function AfricaInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="africa-shell"
      contentClassName="africa-content"
    />
  );
}
