import React from "react";
import { Car, MapPin } from "lucide-react";
import { invitationData } from "./data.js";
import InvitationShell from "../../shared/InvitationShell.jsx";
import Hero from "../../shared/sections/Hero.jsx";
import Countdown from "../../shared/sections/Countdown.jsx";
import Welcome from "../../shared/sections/Welcome.jsx";
import Gallery from "../../shared/sections/Gallery.jsx";
import ImageDivider from "../../shared/sections/ImageDivider.jsx";
import Schedule from "../../shared/sections/Schedule.jsx";
import Details from "../../shared/sections/Details.jsx";
import DressCode from "../../shared/sections/DressCode.jsx";
import Gifts from "../../shared/sections/Gifts.jsx";
import Rsvp from "../../shared/sections/Rsvp.jsx";
import Credit from "../../shared/sections/Credit.jsx";
import HotelList from "../../shared/sections/HotelList.jsx";
import "./styles.css";

function LocationTransport({ title, address, mapUrl, directions }) {
  return (
    <section className="location-transport-section" aria-labelledby="location-transport-title">
      <div className="section-inner narrow" data-reveal>
        <h2 id="location-transport-title">{title}</h2>
        <div className="location-card">
          <MapPin size={22} aria-hidden="true" />
          <p>{address}</p>
          <a href={mapUrl} target="_blank" rel="noreferrer">
            Google Maps
          </a>
        </div>
        <div className="transport-card">
          <Car size={23} aria-hidden="true" />
          <div>
            {directions.map((direction) => (
              <p key={direction}>{direction}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const sectionComponents = {
  hero: Hero,
  countdown: Countdown,
  welcome: Welcome,
  gallery: Gallery,
  imageDivider: ImageDivider,
  details: Details,
  schedule: Schedule,
  dressCode: DressCode,
  locationTransport: LocationTransport,
  hotelList: HotelList,
  gifts: Gifts,
  rsvp: Rsvp,
  credit: Credit,
};

export function EleganteInvitation() {
  const { theme, media, copy, sections } = invitationData;

  return (
    <InvitationShell
      theme={theme}
      media={media}
      copy={copy}
      sections={sections}
      sectionComponents={sectionComponents}
      shellClassName="elegante-shell"
      contentClassName="elegante-content"
    />
  );
}
