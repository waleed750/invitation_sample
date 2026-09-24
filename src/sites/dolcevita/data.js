const asset = (name) => `/assets/dolcevita/${name}`;

const ceremonyAddress = "Piazza della Chiesa, 22010 Ossuccio (CO), Italia";
const receptionAddress = "Via Guido Monzino 1, 22016 Tremezzina (CO), Italia";
const ceremonyQuery = encodeURIComponent(`Chiesa di Santa Maria Maddalena, ${ceremonyAddress}`);
const receptionQuery = encodeURIComponent(`Villa del Balbianello, ${receptionAddress}`);
const ceremonyMapSearch = `https://www.google.com/maps/search/?api=1&query=${ceremonyQuery}`;
const receptionMapSearch = `https://www.google.com/maps/search/?api=1&query=${receptionQuery}`;
const ceremonyMapEmbed = `https://www.google.com/maps?q=${ceremonyQuery}&output=embed`;
const receptionMapEmbed = `https://www.google.com/maps?q=${receptionQuery}&output=embed`;
const ceremonyCalendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=THE%20CEREMONY%20WILL%20TAKE%20PLACE%20AT%20%E2%80%94%20Chiesa%20di%20Santa%20Maria%20Maddalena&dates=20260912T140000Z/20260912T160000Z&location=Chiesa%20di%20Santa%20Maria%20Maddalena%2C%20Piazza%20della%20Chiesa%2C%2022010%20Ossuccio%20(CO)%2C%20Italia";
const receptionCalendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=THE%20RECEPTION%20WILL%20TAKE%20PLACE%20AT%20%E2%80%94%20Villa%20del%20Balbianello&dates=20260912T163000Z/20260913T003000Z&location=Villa%20del%20Balbianello%2C%20Via%20Guido%20Monzino%201%2C%2022016%20Tremezzina%20(CO)%2C%20Italia";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "dolce-vita-lake",
  },
  theme: {
    background: "#f9f6f1",
    foreground: "#1e3151",
    muted: "#5a6d8a",
    ivory: "#f9f6f1",
  },
  couple: {
    firstName: "Marco",
    secondName: "Sofia",
    headline: "We're getting married",
  },
  event: {
    date: "2026-09-12T16:00:00+02:00",
    displayDate: "Saturday, September 12, 2026",
    startTime: "16:00",
    endTime: "01:30",
    venue: "Villa del Balbianello",
    mapUrl: receptionMapSearch,
    label: "Marco & Sofia",
    location: receptionAddress,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
    heroVideoUrl: asset("hero-video.mp4"),
    heroPosterUrl: asset("hero-poster.jpg"),
    musicUrl: asset("background-music.mp3"),
    rsvpConfirmationVideoUrl: asset("rsvp-confirmation.mp4"),
  },
  copy: {
    tapLabel: "Toca para abrir",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "We're getting married",
        firstName: "Marco",
        secondName: "Sofia",
        displayDate: "Saturday, September 12, 2026",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("hero-poster.jpg"),
        ctaLabel: "Scroll down",
        heroVideoLoop: true,
        showOverlayCopy: true,
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-09-12T16:00:00+02:00",
        title: "Countdown",
        kicker: "WE WOULD LIKE TO INVITE YOU TO CELEBRATE WITH US THE MOST SPECIAL DAY OF OUR LIVES.",
        showSeconds: false,
        countdownBgUrl: asset("countdown-bg.jpg"),
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "pets",
        imageUrl: asset("pets-bouquet.png"),
      },
    },
    {
      type: "details",
      props: {
        title: "Location",
        subtitle: "Everything you need to know",
        ceremonyTitle: "THE CEREMONY WILL TAKE PLACE AT",
        ceremonyName: "Chiesa di Santa Maria Maddalena",
        ceremonyTime: "16:00",
        ceremonyAddress,
        ceremonyImageUrl: asset("church-illustration.png"),
        ceremonyMapSrc: ceremonyMapEmbed,
        ceremonyMapSearchUrl: ceremonyMapSearch,
        ceremonyCalendarUrl,
        receptionTitle: "THE RECEPTION WILL TAKE PLACE AT",
        receptionName: "Villa del Balbianello",
        receptionTime: "18:30",
        receptionAddress,
        receptionImageUrl: asset("villa-illustration.png"),
        receptionMapSrc: receptionMapEmbed,
        receptionMapSearchUrl: receptionMapSearch,
        receptionCalendarUrl,
        ribbonUrl: asset("blue-bow-ribbon.png"),
        ribbonBottomUrl: asset("blue-bow-ribbon-bottom.png"),
        lemonUrl: asset("lemon-illustration.png"),
        cocktailUrl: asset("cocktail-glass.png"),
        ringsUrl: asset("rings-illustration.png"),
        beachChairUrl: asset("beach-chair-illustration.png"),
      },
    },
    {
      type: "schedule",
      props: {
        title: "Schedule of the day",
        subtitle: "Saturday · September 12, 2026",
        imageUrl: asset("day-schedule.png"),
        floatyRingUrl: asset("floaty-ring.png"),
        items: [
          { time: "14:00", title: "Wedding Ceremony", description: "Chiesa di Santa Maria Maddalena" },
          { time: "14:45", title: "Transportation", description: "Departure to reception" },
          { time: "16:00", title: "Arrival & welcome drinks", description: "Villa del Balbianello gardens" },
          { time: "17:00", title: "Wedding dinner", description: "Banquet by the lake" },
          { time: "19:30", title: "Wedding cake", description: "Sweet celebration" },
          { time: "20:00", title: "First Dance", description: "Marco & Sofia" },
          { time: "20:30", title: "Party", description: "Music and dancing" },
          { time: "01:00", title: "Farewells & transportation", description: "Boat departures" },
        ],
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Formal attire",
        subtitle: "DRESS CODE",
        illustrationUrl: asset("dress-code-illustration.png"),
        fanUrl: asset("fan-illustration.png"),
        parasolUrl: asset("parasol-illustration.png"),
        items: [
          {
            label: "Style",
            body: "Late-summer formal — light suits or festive attire suited to a lakeside celebration. Ladies are encouraged to wear soft, romantic tones and midi or full-length dresses.",
          },
          {
            label: "Colors",
            body: "Please avoid wearing white — it is reserved for the bride.",
          },
          {
            label: "Footwear",
            body: "Parts of the celebration take place in the gardens of the villa, so please take this into consideration when choosing your footwear.",
          },
        ],
      },
    },
    {
      type: "hotelList",
      props: {
        title: "Accommodation",
        subtitle: "Recommended Stays",
        body: "We have preliminarily reserved a limited number of rooms at a special rate at Grand Hotel Tremezzo, a short walk from Villa del Balbianello.",
        illustrationUrl: asset("accommodation-manor.png"),
        saxUrl: asset("saxophone-illustration.png"),
        violinUrl: asset("violin-illustration.png"),
        hotels: [
          {
            name: "Grand Hotel Tremezzo",
            link: "https://www.grandhoteltremezzo.com/",
            pricePerNight: "€420 per room (-10%)",
            priceNote: "Special rate",
            bookingNote: "Indicate in your RSVP if you would like us to reserve a room for you.",
          },
        ],
      },
    },
    {
      type: "locationTransport",
      props: {
        title: "Transport",
        subtitle: "From the church to the reception",
        body: "We have organised a private boat from Ossuccio to Villa del Balbianello so you can enjoy the celebration without worries.",
        busUrl: asset("transport-bus.png"),
        birdsUrl: asset("birds-envelope.png"),
        boatDeparture: "17:15 – Ossuccio pier",
        returnOptions: ["23:00 – After the first dance", "01:30 – After last dance and farewell"],
        note1: "Please indicate in your RSVP if you need transport (indicate all time slots that apply).",
        note2: "If you are driving yourself, there is parking available near Villa del Balbianello.",
      },
    },
    {
      type: "gifts",
      props: {
        title: "About gifts",
        subtitle: "Gifts",
        body: "Your presence is the greatest gift. If you wish, you may contribute to our honeymoon — we'll be exploring the south of Italy together after the wedding.",
        thanks: "Thank you for being part of this new chapter of our lives.",
        globeUrl: asset("globe-illustration.png"),
        balloonsUrl: asset("balloons.png"),
        wildflowerUrl: asset("wildflower-bouquet.png"),
        options: ["Bank transfer", "Satispay", "WWF Italia"],
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        subtitle: "Please note that this invitation is exclusively for you.",
        ribbonUrl: asset("blue-bow-ribbon.png"),
        ribbonBottomUrl: asset("blue-bow-ribbon-bottom.png"),
        swansUrl: asset("swans.png"),
        rsvpConfirmationVideoUrl: asset("rsvp-confirmation.mp4"),
      },
    },
    {
      type: "credit",
      props: {
        names: "Marco & Sofia",
        date: "12.09.2026",
        loveLine: 'From swiping right … to saying "I do"',
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
        creditUrl: "https://www.thedigitalyes.com",
        kissUrl: asset("couple-kiss.png"),
        footerManorUrl: asset("footer-manor.png"),
      },
    },
  ],
};

export const siteMeta = {
  id: "dolce-vita",
  title: "Dolce Vita",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/dolce-vita/",
  summary:
    "Lake Como wedding with hero video, countdown, dual-venue location, illustrated schedule, dress code, accommodation, boat transport, gifts and RSVP with confirmation video.",
  tags: ["video open", "music", "dolce-vita", "countdown", "map", "schedule", "lake", "romantic"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-poster.jpg"),
    accent: "#1e3151",
  },
};
