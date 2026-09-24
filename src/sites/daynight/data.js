const asset = (name) => `/assets/daynight/${name}`;

const venueName = "Villa Montalcino";
const venueQuery = encodeURIComponent(venueName);
const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${venueQuery}`;
const mapEmbedSrc = `https://www.google.com/maps?q=${venueQuery}&output=embed`;
const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Luc%C3%ADa%20%26%20Felipe&dates=20270918T150000Z/20270919T000000Z&location=Villa%20Montalcino";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "daynight-dual",
  },
  theme: {
    background: "#f1ebdf",
    foreground: "#3a4634",
    muted: "#87926c",
    ivory: "#f1ebdf",
  },
  couple: {
    firstName: "Lucía",
    secondName: "Felipe",
    headline: "We are getting married",
  },
  event: {
    date: "2027-09-18T17:00:00+02:00",
    displayDate: "September 18, 2027",
    startTime: "17:00",
    endTime: "02:00",
    venue: venueName,
    mapUrl: mapSearchUrl,
    label: "Lucía & Felipe",
    location: venueName,
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
    tapLabel: "Tap to open",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "We are getting married",
        firstName: "Lucía",
        secondName: "Felipe",
        displayDate: "September 18, 2027",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("hero-poster.jpg"),
        ctaLabel: "Toggle day / night",
        // Hero is a one-shot day→night scrub (3.04s h264, distinct frames, onEnded triggers dark mode).
        // Keep loop off; show overlay; toggle scrubs forward/backward.
        heroVideoLoop: false,
        showOverlayCopy: true,
      },
    },
    {
      type: "countdown",
      props: {
        date: "2027-09-18T17:00:00+02:00",
        title: "Countdown",
        kicker: "To the most special day of our lives",
        showSeconds: true,
        monogramUrl: asset("monogram-ornate.png"),
      },
    },
    {
      type: "details",
      props: {
        title: "The Details",
        subtitle: "Everything you need to know",
        venue: venueName,
        startTime: "17:00",
        endTime: "02:00",
        mapSrc: mapEmbedSrc,
        mapSearchUrl,
        calendarUrl,
        venueImageUrl: asset("venue-illustration.png"),
        frameUrl: asset("ornate-frame.png"),
        dogBouquetUrl: asset("dog-bouquet.png"),
      },
    },
    {
      type: "schedule",
      props: {
        title: "Order of the Day",
        subtitle: "What we have planned for you",
        coupleDancingUrl: asset("couple-dancing.png"),
        venueEntranceUrl: asset("venue-entrance.png"),
        items: [
          { time: "17:00", title: "Arrival & Welcome Drinks", description: "Reception and welcome cocktails at the villa" },
          { time: "", title: "Ceremony", description: "The most special moment of the day" },
          { time: "", title: "Cocktail Hour & Dinner", description: "Al fresco dining under the stars" },
          { time: "", title: "Party", description: "Let's dance the night away!" },
          { time: "", title: "Last Dance", description: "Farewell and\nbeautiful memories" },
        ],
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        subtitle: "A few gentle reminders",
        illustrationUrl: asset("dress-code-illustration.png"),
        items: [
          {
            label: "Formal Attire",
            body: "We kindly ask you to dress formally to join us on this very special day.",
          },
          {
            label: "",
            body: "Please avoid wearing white — it is reserved for the bride.",
          },
          {
            label: "",
            body: "We recommend ladies avoid stiletto heels. The celebration takes place on a country estate with uneven terrain, so wedges, block heels, low heels, or flats will be much more comfortable.",
          },
        ],
      },
    },
    {
      type: "hotelList",
      props: {
        title: "Accommodation",
        subtitle: "Where to rest",
        body: "We've arranged special rates at two nearby hotels for our guests. We'll do our best to organise shuttle transport for those who don't rent a car, so it helps if you can group together in the same hotel or village.",
        body2: "You may also want to look at Airbnb or other holiday rental platforms — larger groups may find villa rentals more economical.",
        illustrationUrl: asset("accommodation-icon.png"),
        hotels: [
          {
            name: "Hotel Borgo Antico",
            location: "Montalcino · charming hilltop village",
            type: "Boutique Hotel with rooms for 2 or 4 guests.",
            badge: "Minimum 2 nights",
            discount: "15% discount using the code LuciaFelipe",
            tip: "Tip: prices are sometimes lower when booking from a mobile device.",
            link: "https://www.example.com/borgoantico",
          },
          {
            name: "Tenuta Le Colline",
            location: "Tuscan countryside · 10 min from venue",
            type: "A beautiful estate with a pool.",
            badge: "Minimum 2 nights",
            pricePerNight: "€180/night double room with breakfast",
            priceNote: "Fixed price if booked early via bank transfer.",
            warning: "If you choose this option, please contact us directly as we need to coordinate with the manager for the booking and transfer.",
            warningNote: "Standard website prices are over €250 per night.",
            link: "https://www.example.com/tenutalecolline",
          },
        ],
        quickTips: ["Prices have already started rising, so it's best to book this week.", "Same as with flights: book early to avoid paying more."],
      },
    },
    {
      type: "locationTransport",
      props: {
        title: "Transport",
        subtitle: "Getting there",
        body: "The most convenient option is to hire a car so you can explore the area freely. The venue has free unlimited parking, so you won't have any trouble finding a space.",
        body2: "We're also looking into arranging shuttle buses for both the journey there and back. Whether we can offer this will depend on where you're staying — the more centralised you are across a few locations, the easier it will be to organise.",
        busUrl: asset("bus-illustration.png"),
        note: "Please let us know in the RSVP form if you would need shuttle transport should we be able to arrange it.",
      },
    },
    {
      type: "gifts",
      props: {
        title: "Gifts",
        subtitle: "A thoughtful gesture",
        body: "Your presence is the greatest gift of all. For those who wish to give a little something, you can do so in the following ways:",
        flowerBouquetUrl: asset("flower-bouquet.png"),
        options: ["Card — preferred", "Bank Transfer"],
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "photo",
        imageUrl: asset("framed-couple-photo.jpg"),
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        subtitle: "We hope you can make it",
        rsvpConfirmationVideoUrl: asset("rsvp-confirmation.mp4"),
      },
    },
    {
      type: "credit",
      props: {
        names: "Lucía & Felipe",
        date: "September 18, 2027",
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
        creditUrl: "https://thedigitalyes.com",
        ringsUrl: asset("rings-illustration.png"),
        footerBgUrl: asset("footer-bg.png"),
      },
    },
  ],
};

export const siteMeta = {
  id: "daynight",
  title: "Day & Night",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/daynight/",
  summary:
    "Day-to-night dual theme with scrub hero video, countdown, framed venue, illustrated schedule, dress code, accommodation, transport, gifts and RSVP with confirmation video.",
  tags: ["video open", "music", "daynight", "countdown", "map", "schedule", "dress code", "hotels", "gifts", "rsvp", "toggle"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-poster.jpg"),
    accent: "#3a4634",
  },
};
