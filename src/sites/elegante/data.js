const asset = (name) => `/assets/elegante/${name}`;

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=Finca+El+Olivar+Ronda+Malaga+Spain";

const galleryImages = Array.from({ length: 10 }, (_, index) => asset(`gallery-${index + 1}.jpg`));

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
    firstName: "Andrea",
    secondName: "Pedro",
    headline: "We're getting married",
  },
  event: {
    date: "2026-09-12T14:00:00+02:00",
    displayDate: "12 September 2026",
    startTime: "14:00",
    endTime: "00:00",
    venue: "Finca El Olivar",
    mapUrl,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
  },
  copy: {
    tapLabel: "Tap to open",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "We're getting married",
        firstName: "Andrea",
        secondName: "Pedro",
        displayDate: "12 September 2026",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("intro-poster.jpg"),
        heroVideoLoop: true,
        showOverlayCopy: true,
        scrollCueLabel: "RSVP",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-09-12T14:00:00+02:00",
        title: "Countdown",
        untilLabel: "Until 12 September 2026",
        showSeconds: false,
      },
    },
    {
      type: "welcome",
      props: {
        title: "Welcome!",
        body: "We warmly invite you to celebrate our wedding day with us in the beautiful town of Ronda, Andalusia. We look forward to sharing this unforgettable moment with our most special people.",
      },
    },
    {
      type: "gallery",
      props: {
        images: galleryImages,
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
        venue: "Finca El Olivar",
        dateLine: "12 September 2026 · 14:00",
        addressLines: ["Camino de los Olivos s/n, Ronda", "Málaga, 29400 – España"],
        mapUrl,
        mapLabel: "Open in Maps",
        imageUrl: asset("venue-hedsor.png"),
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
        subtitle: "12 September 2026",
        bgUrl: asset("white-textured-paper.png"),
        alternate: true,
        stops: [
          { time: "14:00", text: "Arrival" },
          { time: "14:30", text: "Ceremony" },
          { time: "16:00", text: "Cocktails" },
          { time: "18:00", text: "Dinner" },
          { time: "20:00", text: "Cutting the Cake" },
          { time: "00:00", text: "Finish" },
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
        illustrationUrl: asset("venue-hedsor-front.png"),
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
      type: "welcome",
      id: "pre-wedding-events",
      props: {
        sectionId: "pre-wedding-events",
        title: "Come Say Hello...",
        body: "These are informal gatherings, so feel free to join us if you're in the area.",
        kicker: "Pre-Wedding Events",
        cards: [
          {
            imageUrl: asset("sunday-lunch-illustration.png"),
            heading: "Welcome Drinks",
            date: "Friday, September 11th, 2026",
            time: "8:00 PM",
            body: "Bodega García Hidalgo, Ronda",
          },
          {
            imageUrl: asset("teacup-illustration.png"),
            heading: "Farewell Brunch",
            date: "Sunday, September 13th, 2026",
            time: "12:00 PM",
            body: "Parador de Ronda (terrace)",
          },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("cupid-illustration.png"),
      },
    },
    {
      type: "locationTransport",
      props: {
        title: "Location & Transportation",
        mapUrl,
        address: "Finca El Olivar, Camino de los Olivos s/n, 29400 Ronda, Málaga – Spain",
        directions: [
          "From Málaga: ~1h 30min via A-357 and A-367",
          "From Seville: ~2h via A-376",
          "From Marbella: ~1h via A-397",
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("matchbox-illustration.png"),
      },
    },
    {
      type: "hotelList",
      props: {
        title: "Accommodation",
        subtitle: "Finca El Olivar does not offer lodging. Here are some recommended options nearby.",
        hotels: [
          {
            name: "Parador de Ronda",
            city: "Ronda",
            distanceNote: "2 km de la finca",
            phone: "+34 952 877 500",
            email: "ronda@parador.es",
            websiteUrl: "https://www.parador.es/es/paradores/parador-de-ronda",
          },
          {
            name: "Hotel Catalonia Ronda",
            city: "Ronda",
            distanceNote: "1.5 km",
            phone: "+34 952 872 315",
            email: "ronda@hoteles-catalonia.es",
            websiteUrl: "https://www.cataloniahotels.com/es/hotel/catalonia-ronda",
            promoCode: "BODA2026",
          },
          {
            name: "Hotel Montelirio",
            city: "Ronda",
            distanceNote: "Boutique | Sobre el Tajo",
            phone: "+34 952 873 855",
            email: "reservas@hotelmontelirio.com",
            websiteUrl: "https://www.hotelmontelirio.com",
          },
        ],
        closingNote:
          "For hotels without direct agreements, please mention 'Wedding at Finca El Olivar' to access preferential rates.",
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("locket-illustration.png"),
      },
    },
    {
      type: "gifts",
      props: {
        title: "Gifts",
        body: "Your presence is our greatest gift. If you wish to give us something, please find our bank account information below:",
        bgUrl: asset("gallery-8.jpg"),
        bankAccounts: [
          {
            bankLabel: "CaixaBank",
            accountName: "Andrea Morales",
            iban: "ES00 0000 0000 0000 0000 0000",
            bic: "XXXXXXXXXXX",
          },
          {
            bankLabel: "Banco Santander",
            accountName: "Pedro Fernández",
            iban: "ES00 0000 0000 0000 0000 0000",
            bic: "XXXXXXXXXXX",
          },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("wedding-rings.png"),
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        subtitle: "Let us know if you can make it",
        attendanceOptions: {
          yes: "Yes, I'll be there",
          no: "Unfortunately, I can't make it",
        },
        guestCountMode: "stepper",
        nameFieldLabel: "Person 1 (Main contact)",
        showDietaryField: true,
        dietaryFieldLabel: "Dietary requirements",
        dietaryPlaceholder: "e.g. vegetarian, allergies, etc.",
        childrenMode: "radios",
        childrenLabel: "Will any children be attending?",
        submitLabel: "Send RSVP",
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: asset("swans-framed.png"),
      },
    },
    {
      type: "credit",
      props: {
        name: "Waleed Ashraf",
        portfolioUrl: "https://waleed-ashraf.vercel.app/",
        portfolioLabel: "Portfolio",
        coupleNames: "Andrea & Pedro",
        eventDate: "12 September 2026",
      },
    },
  ],
};

export const siteMeta = {
  id: "elegante",
  title: "Elegante Wedding",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/elegante/",
  summary:
    "Gold and tan Spanish wedding invitation with tap-to-open video, gallery, venue, programme, accommodation, gifts, RSVP, and credit footer.",
  tags: ["video open", "elegante", "gold", "wedding", "gallery", "countdown", "rsvp", "map", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("intro-poster.jpg"),
    accent: "#92723a",
  },
};
