const asset = (name) => `/assets/citystars/${name}`;

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=InterContinental+Citystars+Cairo";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "luxury-floral",
  },
  theme: {
    background: "#f5f3ef",
    foreground: "#835d2f",
    muted: "#e8e4d4",
    ivory: "#f9f6f1",
  },
  couple: {
    firstName: "Ahmad",
    secondName: "Salma",
    headline: "We're getting married",
  },
  event: {
    // Egypt is UTC+2 in August 2026 (no DST observed per current law)
    date: "2026-08-20T20:00:00+02:00",
    displayDate: "20 August 2026",
    startTime: "20:00",
    endTime: "00:00",
    venue: "InterContinental Citystars Cairo",
    mapUrl,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
    musicUrl: asset("background-music.mp3"),
  },
  copy: {
    tapLabel: "Tap to open",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "We're getting married",
        firstName: "Ahmad",
        secondName: "Salma",
        displayDate: "20 August 2026",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("intro-poster.jpg"),
        heroVideoLoop: true,
        showOverlayCopy: true,
        scrollCueLabel: "Scroll",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-08-20T20:00:00+02:00",
        title: "Countdown",
        untilLabel: "Until 20 August 2026",
        showSeconds: false,
      },
    },
    {
      type: "welcome",
      props: {
        title: "Welcome!",
        body: "We warmly invite you to celebrate our wedding day with us. We look forward to sharing this unforgettable moment with our most special people.",
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("floral-vase.png"),
        line: true,
      },
    },
    {
      type: "details",
      props: {
        title: "The Venue",
        subtitle: "Where we celebrate",
        venue: "InterContinental Citystars Cairo",
        dateLine: "20 August 2026 · At Eight O'Clock in the Evening",
        addressLines: ["Cairo, Egypt"],
        mapUrl,
        mapLabel: "Open in Maps",
      },
    },
    {
      type: "imageDivider",
      props: {
        line: true,
      },
    },
    {
      type: "schedule",
      props: {
        title: "Day Programme",
        subtitle: "20 August 2026",
        alternate: true,
        stops: [
          { time: "8:00 PM", text: "Entrance" },
          { time: "8:30 PM", text: "Dinner" },
          { time: "9:00 PM", text: "Dancing" },
          { time: "10:00 PM", text: "Break" },
          { time: "10:30 PM", text: "Cake Cutting" },
          { time: "11:30 PM", text: "Farewell" },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("champagne-tower.png"),
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        groups: [
          { heading: "Women", body: "Cocktail or formal dress" },
          { heading: "Men", body: "Dark suit and tie" },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("bow-illustration.png"),
      },
    },
    {
      type: "gifts",
      props: {
        title: "Gifts",
        body: "Your presence is our greatest gift.",
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("wedding-rings.png"),
      },
    },
    {
      type: "map",
      props: {
        title: "InterContinental Citystars Cairo",
        src: "https://www.google.com/maps?q=InterContinental+Citystars+Cairo&output=embed",
      },
    },
    {
      type: "credit",
      props: {
        name: "Waleed Ashraf",
        portfolioUrl: "https://waleed-ashraf.vercel.app/",
        portfolioLabel: "Portfolio",
        coupleNames: "Ahmad & Salma",
        eventDate: "20 August 2026",
      },
    },
  ],
};

export const siteMeta = {
  id: "citystars",
  title: "Citystars Wedding",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/citystars/",
  summary:
    "Gold and tan Cairo wedding invitation with tap-to-open video, venue, programme, gifts, map, and credit footer.",
  tags: ["video open", "citystars", "gold", "wedding", "countdown", "map", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("intro-poster.jpg"),
    accent: "#92723a",
  },
};
