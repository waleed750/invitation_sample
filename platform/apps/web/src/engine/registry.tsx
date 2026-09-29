"use client";

import type {ComponentType} from "react";
import type {Section, SectionType} from "@platform/shared";
import Hero from "./sections/Hero";
import Countdown from "./sections/Countdown";
import Welcome from "./sections/Welcome";
import Schedule from "./sections/Schedule";
import Details from "./sections/Details";
import Map from "./sections/Map";
import MessageForm from "./sections/MessageForm";
import ImageDivider from "./sections/ImageDivider";
import Story from "./sections/Story";
import DressCode from "./sections/DressCode";
import Gifts from "./sections/Gifts";
import Rsvp from "./sections/Rsvp";
import Faq from "./sections/Faq";
import HotelList from "./sections/HotelList";
import Gallery from "./sections/Gallery";
import Credit from "./sections/Credit";
import Footer from "./sections/Footer";

// Wrappers narrow the discriminated union before passing props to each component.
export const sectionComponents: Partial<Record<SectionType, ComponentType<{section: Section}>>> = {
  hero: ({section}) => section.type === "hero" ? <Hero {...section.props} /> : null,
  countdown: ({section}) => section.type === "countdown" ? <Countdown {...section.props} /> : null,
  welcome: ({section}) => section.type === "welcome" ? <Welcome {...section.props} /> : null,
  schedule: ({section}) => section.type === "schedule" ? <Schedule {...section.props} /> : null,
  details: ({section}) => section.type === "details" ? <Details {...section.props} /> : null,
  map: ({section}) => section.type === "map" ? <Map {...section.props} /> : null,
  messageForm: ({section}) => section.type === "messageForm" ? <MessageForm {...section.props} /> : null,
  imageDivider: ({section}) => section.type === "imageDivider" ? <ImageDivider {...section.props} /> : null,
  story: ({section}) => section.type === "story" ? <Story {...section.props} /> : null,
  dressCode: ({section}) => section.type === "dressCode" ? <DressCode {...section.props} /> : null,
  gifts: ({section}) => section.type === "gifts" ? <Gifts {...section.props} /> : null,
  rsvp: ({section}) => section.type === "rsvp" ? <Rsvp {...section.props} /> : null,
  faq: ({section}) => section.type === "faq" ? <Faq {...section.props} /> : null,
  hotelList: ({section}) => section.type === "hotelList" ? <HotelList {...section.props} /> : null,
  gallery: ({section}) => section.type === "gallery" ? <Gallery {...section.props} /> : null,
  credit: ({section}) => section.type === "credit" ? <Credit {...section.props} /> : null,
  footer: ({section}) => section.type === "footer" ? <Footer {...section.props} /> : null,
};
