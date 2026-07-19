import React from "react";
import { invitationData } from "./data";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Welcome from "../../shared/sections/Welcome.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import Details from "../../shared/sections/Details.jsx";
import Map from "../../shared/sections/Map.jsx";
import MessageForm from "../../shared/sections/MessageForm.jsx";
import "./styles.css";

function ImageDivider({ imageUrl }) {
  return (
    <div className="image-divider" aria-hidden="true">
      <img src={imageUrl} alt="" />
    </div>
  );
}

function Footer({ ornamentUrl }) {
  return (
    <footer className="footer-section">
      <img src={ornamentUrl} alt="" aria-hidden="true" />
    </footer>
  );
}

const sectionComponents = {
  hero: Hero,
  countdown: Countdown,
  welcome: Welcome,
  schedule: Schedule,
  details: Details,
  map: Map,
  messageForm: MessageForm,
  imageDivider: ImageDivider,
  footer: Footer,
};

export function VideoOpenInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="invitation-shell"
      contentClassName="invitation-content"
    />
  );
}
