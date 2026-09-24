const asset = (name) => `/assets/bloom/${name}`;

const venueName = "Hotel du Cap-Eden-Roc";
const venueLocation = "Antibes, France";
const fullVenue = `${venueName}, ${venueLocation}`;
const venueQuery = encodeURIComponent(`${venueName}, Boulevard J. F. Kennedy, 06160 Antibes, France`);
const bellesRivesQuery = encodeURIComponent("Hôtel Belles Rives, 33 Boulevard Édouard Baudoin, 06160 Juan-les-Pins, France");
const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${venueQuery}`;
const mapEmbedSrc = `https://www.google.com/maps?q=${venueQuery}&output=embed`;
const bellesRivesSearchUrl = `https://www.google.com/maps/search/?api=1&query=${bellesRivesQuery}`;
const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Martina%20%26%20Javier%20%E2%80%93%20Wedding&dates=20260927T153000Z/20260927T233000Z&location=Hotel%20du%20Cap-Eden-Roc%2C%20Boulevard%20J.%20F.%20Kennedy%2C%2006160%20Antibes%2C%20France";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "bloom-garden",
  },
  theme: {
    background: "#f4ede1",
    foreground: "#2f3d2b",
    muted: "#8a8f85",
    ivory: "#f4ede1",
  },
  couple: {
    firstName: "Martina",
    secondName: "Javier",
    headline: "We're getting married",
  },
  event: {
    date: "2026-09-27T17:30:00+02:00",
    displayDate: "September 27, 2026",
    startTime: "5:30 PM",
    endTime: "1:30 AM",
    venue: fullVenue,
    mapUrl: mapSearchUrl,
    label: "Martina & Javier",
    location: fullVenue,
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
        firstName: "Martina",
        secondName: "Javier",
        displayDate: "27\nSEP\n2026",
        ctaLabel: "Discover",
        heroBgUrl: asset("hero-bg.jpg"),
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-09-27T17:30:00+02:00",
        title: "Countdown",
        subtitle: "Until 27 September 2026",
        showSeconds: false,
        frameUrl: asset("countdown-frame.png"),
      },
    },
    {
      type: "welcome",
      props: {
        title: "Welcome",
        parents: "Together with their families",
        body: "request the honor of your presence as they exchange vows of marriage",
        dateLine: "the twenty-seventh of September\ntwo thousand twenty-six",
        dayLabel: "on Sunday",
        flowersTopUrl: asset("welcome-flowers.png"),
        flowersBottomUrl: asset("welcome-flowers-bottom.png"),
      },
    },
    {
      type: "details",
      props: {
        title: "Ceremony\n& Reception",
        subtitle: "Where we celebrate",
        venue: venueName,
        locationLine: venueLocation,
        date: "Sunday, September 27, 2026",
        time: "5:30 PM",
        street: "Boulevard J. F. Kennedy",
        zip: "06160 Antibes, France",
        mapSearchUrl,
        mapSrc: mapEmbedSrc,
        calendarUrl,
        ovalBgUrl: asset("ceremony-oval-bg.jpg"),
        venueIllustrationUrl: asset("venue-illustration.png"),
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        subtitle: "Black Tie",
        frameUrl: asset("dress-code-frame.png"),
        illustrationUrl: asset("black-tie-illustration.png"),
      },
    },
    {
      type: "schedule",
      props: {
        title: "Wedding Day Programme",
        frameUrl: asset("programme-frame.png"),
        items: [
          { time: "5:30 PM", label: "Ceremony" },
          { time: "6:30 PM", label: "Cocktail Hour" },
          { time: "7:30 PM", label: "Dinner & Dancing" },
          { time: "UNTIL 1:30 AM", label: "CELEBRATION" },
        ],
      },
    },
    {
      type: "story",
      props: {
        title: "How it all started…",
        buttonLabel: "Our Story",
        stories: ["Our story is one we can't wait to share. Stay tuned."],
        butterflyUrls: [
          asset("butterfly-1.png"),
          asset("butterfly-2.png"),
          asset("butterfly-3.png"),
          asset("butterfly-4.png"),
          asset("butterfly-5.png"),
        ],
        butterflyPairLeft: asset("butterfly-1.png"),
        butterflyPairRight: asset("butterfly-2.png"),
        gallery: [
          asset("gallery-1.jpg"),
          asset("gallery-2.jpg"),
          asset("gallery-3.jpg"),
          asset("gallery-4.jpg"),
          asset("gallery-5.jpg"),
          asset("gallery-6.jpg"),
          asset("gallery-7.jpg"),
          asset("gallery-8.jpg"),
          asset("gallery-9.jpg"),
          asset("gallery-10.jpg"),
          asset("gallery-11.jpg"),
          asset("gallery-12.jpg"),
          asset("gallery-13.jpg"),
          asset("gallery-14.jpg"),
          asset("gallery-15.jpg"),
          asset("gallery-16.jpg"),
          asset("gallery-17.jpg"),
          asset("gallery-18.jpg"),
          asset("gallery-19.jpg"),
        ],
      },
    },
    {
      type: "weddingWeekend",
      props: {
        title: "The Weekend",
        subtitle: "Join us the evening before",
        eventTitle: "Restaurant César",
        city: "Cap d'Antibes, France",
        date: "Saturday | 26 September 2026",
        time: "5:30 – 8:30 PM",
        street: "Plage Keller, Chemin de la Garoupe",
        zip: "06160 Antibes, France",
        churchUrl: asset("weekend-church-oval.png"),
        flowerUrl: asset("weekend-flower.png"),
        hummingbirdUrl: asset("weekend-hummingbird.png"),
        starfishUrl: asset("weekend-starfish.png"),
        orangesUrl: asset("weekend-oranges-oval.png"),
      },
    },
    {
      type: "hotelList",
      props: {
        title: "Travel & Stay",
        subtitle: "We recommend flying into Nice Côte d'Azur Airport (NCE, ~30 min). A preferred room block is reserved at Hotel du Cap-Eden-Roc.",
        hotels: [
          {
            name: "Hotel du Cap-Eden-Roc",
            location: "Boulevard J. F. Kennedy · 06160 Antibes, France",
            eyebrow: "Preferred Room Block",
            dates: "September 26 – 28, 2026",
            rates: ["Classic Room — €890 / night", "Deluxe Sea View — €1,250 / night"],
            bookBy: "Reserve by Monday, July 27, 2026",
            reference: "Reference: Martina / Javier\nWedding Room Block",
            phone: "+33 4 93 61 39 01",
            mapsQuery: "Hotel du Cap-Eden-Roc, Boulevard J. F. Kennedy, 06160 Antibes, France",
            archwayUrl: asset("accommodation-archway.png"),
            bellhopUrl: asset("accommodation-bellhop.png"),
            keyUrl: asset("accommodation-key.png"),
          },
          {
            name: "Hôtel Belles Rives",
            location: "33 Boulevard Édouard Baudoin · 06160 Juan-les-Pins, France",
            eyebrow: "Additional Option",
            phone: "+33 4 93 61 02 79",
            mapsQuery: "Hotel Belles Rives, 33 Boulevard Edouard Baudoin, 06160 Juan-les-Pins, France",
            poolUrl: asset("accommodation-pool.png"),
          },
        ],
      },
    },
    {
      type: "locationTransport",
      props: {
        title: "Wedding Day Transportation",
        subtitle: "Getting to the venue",
        body: "Complimentary shuttles will be provided on the wedding day, Sunday, September 27, from Hôtel Belles Rives to the venue. Complimentary valet will be provided for those who wish to drive.",
        note: "Please indicate your transportation preference in your RSVP.",
        address: "Hôtel Belles Rives\n33 Boulevard Édouard Baudoin,\n06160 Juan-les-Pins, France",
        mapsQuery: "Hôtel Belles Rives, 33 Boulevard Édouard Baudoin, 06160 Juan-les-Pins, France",
        mapsUrl: bellesRivesSearchUrl,
        butterflyUrl: asset("transport-butterfly.png"),
        palmsUrl: asset("transport-palms.png"),
        surfboardUrl: asset("transport-surfboard-bag.png"),
        shellUrl: asset("transport-shell.png"),
        carUrl: asset("transport-car.png"),
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        subtitle: "Kindly respond by 15 July 2026",
        portraitUrl: asset("rsvp-portrait.jpg"),
        floralTopUrl: asset("floral-top-right.png"),
        floralBottomUrl: asset("floral-bottom-left.png"),
      },
    },
    {
      type: "credit",
      props: {
        names: "Martina & Javier",
        date: "September 27, 2026",
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
        creditUrl: "https://www.thedigitalyes.com",
        frameUrl: asset("checkered-frame.png"),
      },
    },
  ],
};

export const siteMeta = {
  id: "bloom",
  title: "Bloom",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/bloom/",
  summary:
    "French Riviera garden wedding with butterfly hero, countdown, ceremony at Hotel du Cap-Eden-Roc, black-tie dress code, programme, story gallery, weekend at Restaurant César, hotels and shuttle transport.",
  tags: ["video open", "music", "bloom", "countdown", "garden", "butterfly", "gallery", "rsvp"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-bg.jpg"),
    accent: "#2f3d2b",
  },
};
