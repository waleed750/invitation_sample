const introPosterUrl = "/assets/boho/intro-poster.jpg";
const introVideoUrl = "/assets/boho/intro-video.mp4";
const musicUrl = "/assets/boho/background-music.mp3";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "save-the-date",
    experienceType: "scroll-only",
    introType: "video-open",
    layoutFamily: "boho",
  },
  theme: {
    background: "#ffffff",
    foreground: "#3a2a1a",
    muted: "#8a7a6a",
    ivory: "#f5f0e8",
  },
  couple: {
    firstName: "Olivia",
    secondName: "Ethan",
    headline: "Save the Date",
  },
  event: {
    date: "2026-09-06T00:00:00+08:00",
    displayDate: "6 September 2026",
    startTime: "",
    endTime: "",
    venue: "Philippines",
    label: "Save the Date",
    location: "Philippines",
  },
  media: {
    introPosterUrl,
    introVideoUrl,
    musicUrl,
  },
  copy: {
    tapLabel: "Tap to open",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "Save the Date",
        firstName: "Olivia",
        secondName: "Ethan",
        displayDate: "6 September 2026\nPhilippines",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-09-06T00:00:00+08:00",
        title: "Counting Down to Our Wedding Weekend",
        untilLabel: "6 September 2026",
        decorationTop: "/assets/boho/floral-palm.png",
        decorationBottom: "/assets/boho/floral-hibiscus.png",
        circleImage: "/assets/boho/countdown-circle.png",
      },
    },
    {
      type: "weddingWeekend",
      props: {
        eyebrow: "A two-day celebration",
        title: "Our Wedding\nWeekend",
        body: "Please join us for a two-day wedding celebration beginning with a Welcome Dinner on Friday, September 5, 2026, followed by our Wedding Day on Saturday, September 6, 2026.",
        tileFrameUrl: "/assets/boho/tile-frame.png",
        leafDividerUrl: "/assets/boho/leaf-divider.png",
        palmSunsetUrl: "/assets/boho/palm-sunset.png",
        events: [
          {
            dateLabel: "Friday \u00b7 5 September 2026",
            title: "Welcome Dinner",
          },
          {
            dateLabel: "Saturday \u00b7 6 September 2026",
            title: "Wedding Day",
          },
        ],
      },
    },
    {
      type: "travelInfo",
      props: {
        eyebrow: "Planning your trip",
        title: "Travel\nInformation",
        body: "For guests traveling internationally, the nearest airport options are:",
        shellDividerUrl: "/assets/boho/shell-divider.png",
        flowerDividerUrl: "/assets/boho/flower-divider.png",
        palmDividerUrl: "/assets/boho/palm-divider.png",
        airports: [
          {
            code: "MNL",
            name: "Ninoy Aquino International Airport",
            location: "Manila",
            frameUrl: "/assets/boho/frame-flower.png",
            illustrationUrl: "/assets/boho/travel-suitcase.png",
          },
          {
            code: "CRK",
            name: "Clark International Airport",
            location: "Pampanga",
            frameUrl: "/assets/boho/frame-shell.png",
            illustrations: [
              "/assets/boho/travel-save-date-tag.png",
              "/assets/boho/travel-passport.png",
              "/assets/boho/travel-postcard.png",
            ],
          },
        ],
        palmStampUrl: "/assets/boho/travel-palm-stamp.png",
      },
    },
    {
      type: "faq",
      props: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "When should we book flights?",
            answer: "",
          },
          {
            question: "Will accommodation details be provided?",
            answer: "",
          },
          {
            question: "Can I bring a plus one?",
            answer: "",
          },
          {
            question: "Will additional wedding details be shared later?",
            answer: "",
          },
        ],
      },
    },
    {
      type: "rsvp",
      props: {
        title: "Kindly Let Us Know",
        subtitle: "",
        bgUrl: "/assets/boho/rsvp-frame.png",
        decorations: [
          "/assets/boho/rsvp-coconut-papaya.png",
          "/assets/boho/rsvp-palm-surfboard.png",
          "/assets/boho/rsvp-coral-shell.png",
        ],
        wavesPosterUrl: "/assets/boho/rsvp-waves-poster.jpg",
        wavesVideoUrl: "/assets/boho/rsvp-waves-video.mp4",
        confirmationVideoUrl: "/assets/boho/rsvp-confirmation.mp4",
      },
    },
    {
      type: "bohoFooter",
      props: {
        names: "Olivia & Ethan",
        month: "SEPTEMBER",
        year: "2026",
        frameUrl: "/assets/boho/footer-frame.png",
        monogramUrl: "/assets/boho/footer-monogram.png",
        starfishUrl: "/assets/boho/footer-starfish.png",
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
      },
    },
  ],
};

export const siteMeta = {
  id: "boho",
  title: "Boho Save the Date",
  category: "Save The Date",
  eventType: "Save The Date",
  status: "Converted demo",
  href: "/boho/",
  summary: "Boho beach save-the-date: video-open intro, two-day wedding weekend, travel info, FAQ, RSVP form with confirmation animation.",
  tags: ["video open", "music", "countdown", "rsvp", "faq", "beach", "boho", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: "/assets/boho/intro-poster.jpg",
    accent: "#8a7a6a",
  },
};
