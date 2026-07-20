const introPosterUrl = "/assets/maldives/intro-poster.jpg";
const introVideoUrl = "/assets/maldives/intro-video.mp4";
const heroVideoUrl = "/assets/maldives/hero-video.mp4";
const heroBgUrl = "/assets/maldives/hero-bg.jpg";
const musicUrl = "/assets/maldives/background-music.mp3";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "tropical-editorial",
  },
  theme: {
    background: "#faf6f1",
    foreground: "#2c4a3e",
    muted: "#a8b5a0",
    ivory: "#f0ebe3",
  },
  couple: {
    firstName: "Rosie",
    secondName: "Scott",
    headline: "INVITE YOU TO CELEBRATE OUR WEDDING WEEK",
  },
  event: {
    date: "2027-07-01T16:30:00+05:00",
    displayDate: "28 June \u2013 01 July 2027",
    startTime: "7:30 PM",
    endTime: null,
    venue: "Vaavu Fulidhoo, Maldives",
    label: "We\u2019re getting married",
    location: "Vaavu Fulidhoo, Maldives",
  },
  media: {
    introPosterUrl,
    introVideoUrl,
    heroVideoUrl,
    heroBgUrl,
    musicUrl,
  },
  copy: {
    tapLabel: "We\u2019re getting married",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "INVITE YOU TO CELEBRATE OUR WEDDING WEEK",
        firstName: "Rosie",
        secondName: "Scott",
        displayDate: "28 June \u2013 01 July 2027",
        heroVideoUrl,
        heroBgUrl,
        heroPosterUrl: heroBgUrl,
        monogramUrl: "/assets/maldives/monogram-hero-green.png",
        location: "Vaavu Fulidhoo, Maldives",
        dateStart: "28 JUNE 2027",
        dateEnd: "01 JULY",
        ctaLabel: "Keep scrolling and RSVP",
        palmLeftUrl: "/assets/maldives/palm-left.png",
        palmRightUrl: "/assets/maldives/palm-right.png",
        islandCenterUrl: "/assets/maldives/island-center.png",
        hangingLightsUrl: "/assets/maldives/hanging-lights.png",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2027-07-01T16:30:00+05:00",
        title: "Countdown",
        untilLabel: "Until 01 July 2027",
        showMonths: true,
      },
    },
    {
      type: "welcome",
      props: {
        title: "The Experience",
        body: "Over five unforgettable days, we invite you to escape with us to the island of Fulidhoo for sunsets, celebrations, ocean adventures and the beginning of our forever.",
      },
    },
    {
      type: "schedule",
      props: {
        title: "The Celebrations",
        subtitle: null,
        items: [
          { title: "Welcome Dinner", description: "Fulidhoo Beach \u00b7 28 June 2027 \u00b7 7.30pm" },
          { title: "Engagement Party", description: "Kinan Sentral \u00b7 29 June 2027 \u00b7 4.30pm" },
          { title: "Wedding Day", description: "Venue to be revealed \u00b7 01 July 2027" },
        ],
        bgUrl: "/assets/maldives/candles-v2.png",
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        body: "Welcome Dinner\n28th June 2027\nIsland Chic\n\nEngagement Party\n29th June 2027\nTropical Elegance\n\nWedding\n1st July 2027\nSoft Coastal Palette",
        events: [
          {
            dateLabel: "28th June 2027",
            title: "Island Chic",
            colors: [{ name: "White", swatchUrl: null }],
          },
          {
            dateLabel: "29th June 2027",
            title: "Tropical Elegance",
            colors: [
              { name: "Sage Green", swatchUrl: "/assets/maldives/watercolor-sage-green.png" },
              { name: "Beige", swatchUrl: "/assets/maldives/watercolor-beige.png" },
              { name: "Baby Blue", swatchUrl: "/assets/maldives/watercolor-baby-blue.png" },
              { name: "Dusty Rose", swatchUrl: "/assets/maldives/watercolor-dusty-rose-tropical.png" },
            ],
          },
          {
            dateLabel: "1st July 2027",
            title: "Soft Coastal Palette",
            colors: [
              { name: "Dusty Rose", swatchUrl: "/assets/maldives/watercolor-dusty-rose-uniform.png" },
              { name: "Lavender", swatchUrl: "/assets/maldives/watercolor-lavender-uniform.png" },
              { name: "Taupe", swatchUrl: "/assets/maldives/watercolor-taupe-uniform.png" },
              { name: "Sky Blue", swatchUrl: "/assets/maldives/watercolor-sky-blue-uniform.png" },
            ],
          },
        ],
      },
    },
    {
      type: "travelInfo",
      props: {
        eyebrow: "Your Stay",
        title: "Kinan Sentral",
        body: "Transportation and accommodation throughout the wedding celebrations will be lovingly hosted by the couple.\n\nGuests will be staying at",
        venueLocation: "Vaavu Fulidhoo, Maldives",
        venueImageUrl: "/assets/maldives/kinan-sentral-venue.png",
      },
    },
    {
      type: "rsvp",
      props: {
        title: "Rsvp",
        subtitle: "The favour of a reply is kindly requested by the 30th of June, 2027",
        events: [
          "Welcome Dinner \u2014 28 June 2027",
          "Engagement Celebration \u2014 29 June 2027",
          "Wedding Day \u2014 01 July 2027",
        ],
      },
    },
    {
      type: "footer",
      props: {
        names: "Rosie & Scott",
        date: "1 July 2027",
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
        monogramUrl: "/assets/maldives/monogram-rs.png",
      },
    },
  ],
};

export const siteMeta = {
  id: "maldives",
  title: "Maldives Beach Wedding",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/maldives/",
  summary: "Tropical beach wedding: envelope video intro, five-day celebration schedule, multi-event dress code with color swatches, RSVP form, and accommodation details.",
  tags: ["video open", "music", "countdown", "rsvp", "dress code", "travel", "beach", "scroll", "maldives"],
  template: invitationData.template,
  preview: {
    imageUrl: "/assets/maldives/hero-bg.jpg",
    accent: "#2c4a3e",
  },
};
