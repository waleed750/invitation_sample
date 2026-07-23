const introPosterUrl = "/assets/excellence/intro-poster.jpg";
const introVideoUrl = "/assets/excellence/intro-video.mp4";
const musicUrl = "/assets/excellence/background-music.mp3";
const heroVideoUrl = "/assets/excellence/hero-video.mp4";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "luxury-floral",
  },
  theme: {
    background: "#f6f4ee",
    foreground: "#3a5542",
    muted: "#e7e2da",
    ivory: "#f6f4ee",
  },
  couple: {
    firstName: "Mohamad",
    secondName: "Salma",
    headline: "We are getting married",
  },
  event: {
    date: "2026-08-20T18:00:00+03:00",
    displayDate: "20 August 2026",
    startTime: "6:00 PM",
    endTime: "10:00 PM",
    venue: "The Peninsula Hotel Istanbul",
    mapUrl: "https://www.google.com/maps/place/The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul/@41.0230125,28.9779274,17z",
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
        heroVideoUrl,
        heroPosterUrl: introPosterUrl,
        heroVideoLoop: false,
        showOverlayCopy: true,
        headline: "We are getting married",
        firstName: "Mohamad",
        secondName: "Salma",
        overlayFadeOutAt: 4,
        scrollCueLabel: "Keep scrolling and RSVP",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-08-20T18:00:00+03:00",
        title: "Countdown",
        untilLabel: "Until 20 August 2026",
        columnLeftUrl: "/assets/excellence/column-left.png",
        columnRightUrl: "/assets/excellence/column-right.png",
        showSeconds: false,
      },
    },
    {
      type: "welcome",
      props: {
        title: "The Celebrations",
        cards: [
          {
            kicker: "Welcome Cruise on the Bosphorus",
            heading: "The Peninsula Private Quay",
            body: "Departing from The Peninsula Private Quay",
            date: "19 August 2026",
            time: "6:30 PM",
            mapUrl: "https://www.google.com/maps/place/The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul/@41.0230125,28.9779274,17z",
            imageUrl: "/assets/excellence/yacht-illustration.png",
          },
          {
            kicker: "Wedding",
            heading: "The Peninsula Hotel Istanbul",
            date: "20 August 2026",
            time: "6:00 PM",
            mapUrl: "https://www.google.com/maps/place/The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul/@41.0230125,28.9779274,17z",
            imageUrl: "/assets/excellence/peninsula-hotel.png",
          },
        ],
      },
    },
    {
      type: "schedule",
      props: {
        title: "Wedding Weekend",
        subtitle: "Itinerary\n19 – 20 August 2026",
        items: [
          {
            title: "Welcome Cruise on the Bosphorus",
            subtitle: "19 August 2026\nPlease join us for cocktails and hors d'œuvres as we sail the Bosphorus",
            stops: [
              {
                time: "6:30 PM",
                text: "Departure from The Peninsula Private Quay",
              },
              {
                time: "6:30 – 9:30 PM",
                text: "Sunset Cocktails & Hors d'Œuvres",
              },
              {
                time: "10:00 PM",
                text: "Arrival at The Peninsula Private Quay",
              },
            ],
          },
          {
            title: "Wedding",
            subtitle: "20 August 2026 · The Peninsula Hotel Istanbul",
            stops: [
              {
                time: "6:00 PM",
                text: "Arrival & Welcome Drinks",
              },
              {
                text: "Ceremony",
              },
              {
                text: "Banquet",
              },
              {
                text: "Party",
              },
              {
                text: "After Party",
              },
            ],
          },
        ],
        bgUrl: "/assets/excellence/candles.png",
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        cards: [
          {
            heading: "Welcome Cruise",
            date: "19TH AUGUST",
            attire: "White Cocktail Attire",
            imageUrl: "/assets/excellence/bouquet.png",
          },
          {
            heading: "Wedding",
            date: "20TH AUGUST",
            attire: "Black Tie",
            imageUrl: "/assets/excellence/cypress-trees.png",
          },
        ],
      },
    },
    {
      type: "map",
      props: {
        title: "The Peninsula Hotel Istanbul",
        src: "https://www.google.com/maps?q=The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul&output=embed",
      },
    },
    {
      type: "gifts",
      props: {
        title: "Wedding Gift",
        body: "Your presence is our greatest gift.\n\nIf you wish to honour us with a gift, we kindly prefer monetary contributions. Bank details will be shared separately.",
        bgUrl: "/assets/excellence/roses-top-left.png",
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        subtitle: "The favour of a reply is kindly requested by the fifteenth of June, 2026",
        bgUrl: "/assets/excellence/vase-left.png",
        bottomUrl: "/assets/excellence/vase-right.png",
        attendanceOptions: {
          yes: "Delighted to accept",
          no: "Regretfully unable to attend",
        },
        eventOptions: [
          { label: "Welcome Cruise - 19th August", value: "welcome-cruise" },
          { label: "Wedding Ceremony & Reception - 20th August", value: "wedding" },
        ],
        guestCountMode: "stepper",
        nameFieldLabel: "Principal guest",
        childrenMode: "radios",
        childrenLabel: "Will any children be accompanying you?",
        submitLabel: "SUBMIT RESPONSE",
      },
    },
    {
      type: "credit",
      props: {
        name: "Waleed Ashraf",
        portfolioUrl: "https://waleed-ashraf.vercel.app/",
        portfolioLabel: "Portfolio",
        monogramUrl: "/assets/excellence/monogram.png",
        coupleNames: "Mohamad & Salma",
        eventDate: "20 August 2026",
      },
    },
  ],
};

export const siteMeta = {
  id: "excellence",
  title: "Excellence Wedding",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/excellence/",
  summary: "Luxury floral wedding: tap-to-open intro, wedding weekend itinerary, dress code, map, RSVP form, and credit footer.",
  tags: ["video open", "luxury", "floral", "wedding weekend", "countdown", "rsvp", "map", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: "/assets/excellence/intro-poster.jpg",
    accent: "#3a5542",
  },
};
