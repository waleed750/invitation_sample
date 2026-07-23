import React from "react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Welcome from "../../shared/sections/Welcome.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import Details from "../../shared/sections/Details.jsx";
import Map from "../../shared/sections/Map.jsx";
import DressCode from "../../shared/sections/DressCode.jsx";
import Gifts from "../../shared/sections/Gifts.jsx";
import Rsvp from "../../shared/sections/Rsvp.jsx";
import Credit from "../../shared/sections/Credit.jsx";
import "./styles.css";

const sectionComponents = {
  hero: Hero,
  countdown: Countdown,
  welcome: Welcome,
  schedule: Schedule,
  details: Details,
  map: Map,
  dressCode: DressCode,
  gifts: Gifts,
  rsvp: Rsvp,
  credit: Credit,
};

export function ExcellenceInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="excellence-shell"
      contentClassName="excellence-content"
    />
  );
}
