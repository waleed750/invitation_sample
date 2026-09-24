const asset = (name) => `/assets/bridgerton/${name}`;

const venueName = "Château de la Couronne";
const venueAddress = "Nouvelle-Aquitaine, France";
const fullVenue = `${venueName}, ${venueAddress}`;
const venueQuery = encodeURIComponent(`${venueName} Marthon`);
const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${venueQuery}`;
const mapEmbedSrc = `https://www.google.com/maps?q=${venueQuery}&output=embed`;
const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Lucia%20%26%20Matteo&dates=20270727T170000Z/20270727T220000Z&location=Ch%C3%A2teau%20de%20la%20Couronne%2C%20Nouvelle-Aquitaine%2C%20France";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "bridgerton-regency",
  },
  theme: {
    background: "#fdf9f3",
    foreground: "#4a2b3d",
    muted: "#8a7a8a",
    ivory: "#fdf9f3",
  },
  couple: {
    firstName: "Lucia",
    secondName: "Matteo",
    headline: "We are getting married",
  },
  event: {
    date: "2027-07-27T19:00:00+02:00",
    displayDate: "July 27, 2027",
    startTime: "7:00 PM",
    endTime: "11:00 PM",
    venue: fullVenue,
    mapUrl: mapSearchUrl,
    label: "Lucia & Matteo",
    location: fullVenue,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
    heroVideoUrl: asset("hero-video.mp4"),
    heroPosterUrl: asset("hero-poster.jpg"),
    musicUrl: asset("background-music.mp3"),
  },
  copy: {
    tapLabel: "Tap to open",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "The Wedding of",
        firstName: "Lucia",
        secondName: "Matteo",
        displayDate: "27 July 2027",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("hero-poster.jpg"),
        locationLine: "Château de la Couronne, Nouvelle-Aquitaine, France",
        heroVideoLoop: true,
        showOverlayCopy: true,
      },
    },
    {
      type: "welcome",
      props: {
        title: "Join Us To Celebrate\nOur Wedding",
        body: "We are so excited to celebrate this\nspecial day with you.",
        timeLabel: "Time & Location",
        venue: fullVenue,
        time: "7:00 PM",
        mapSearchUrl,
        calendarUrl,
        chateauUrl: asset("welcome-chateau.png"),
        venueFrameUrl: asset("venue-frame-bg.jpg"),
      },
    },
    {
      type: "countdown",
      props: {
        date: "2027-07-27T19:00:00+02:00",
        title: "Countdown",
        subtitle: "Until 27 July 2027",
        showSeconds: true,
        drapeLeftUrl: asset("countdown-drape-left.png"),
        drapeRightUrl: asset("countdown-drape-right.png"),
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        subtitle: "Formal Black-Tie",
        formalDesc:
          "In the spirit of a candlelit evening at the château, we invite you to dress in your most refined black-tie attire. Gentlemen in tuxedos or dark formal suits; ladies in floor-length gowns or elegant cocktail dresses.",
        noteDesc:
          "Embrace soft romantic tones — champagne, blush, dusty blue, sage, plum and midnight — and step lightly on grass and gravel with heels that can dance until dawn. Please reserve ivory and off-white for the bride.",
        portraitUrl: asset("dress-portrait.png"),
        fanUrl: asset("fan.png"),
      },
    },
    {
      type: "hotelList",
      props: {
        title: "Where to Stay",
        subtitle: "Nearby options for our guests",
        hotels: [
          {
            name: "Domaine des Etangs, Auberge Resorts",
            location: "20 min drive · Massignac",
            link: "https://www.aubergeresorts.com/etangs/",
            note: "A serene lakeside estate and Auberge Resort just minutes from the château.",
          },
          {
            name: "Chais Monnet Hôtel & Spa",
            location: "45 min drive · Cognac",
            link: "https://www.chaismonnet.com/",
            note: "Elegant 5-star retreat set in the historic heart of Cognac.",
          },
          {
            name: "Mercure Angoulême Hôtel de France",
            location: "35 min drive · Angoulême",
            link: "https://all.accor.com/hotel/1213/index.en.shtml",
            note: "Central Angoulême hotel, a convenient base for exploring the region.",
          },
        ],
      },
    },
    {
      type: "discover",
      props: {
        title: "Discover Nouvelle-Aquitaine",
        subtitle: "A few places while you're visiting",
        categories: [
          {
            heading: "Restaurants & Cafés",
            items: [
              { name: "Les Sources de Fontanille", location: "Massignac" },
              { name: "Les Foudres", location: "Cognac" },
              { name: "La Ruelle", location: "Angoulême" },
              { name: "Hostellerie du Château", location: "La Rochefoucauld" },
              { name: "Le Terminus", location: "Cognac" },
            ],
          },
          {
            heading: "Shopping",
            items: [
              { name: "Marché des Halles", location: "Angoulême" },
              { name: "Rue Marengo", location: "Angoulême" },
              { name: "Maisons de Cognac", location: "Cognac" },
            ],
          },
          {
            heading: "Villages & Landmarks",
            items: [
              { name: "Aubeterre-sur-Dronne", location: "Charente" },
              { name: "Château de La Rochefoucauld", location: "Charente" },
              { name: "Vieil Angoulême", location: "Angoulême" },
            ],
          },
          {
            heading: "Beauty Services",
            items: [
              { name: "Dessange", location: "Angoulême", contact: "+33 5 45 92 25 25" },
              { name: "Camille Albane", location: "Angoulême", contact: "+33 5 45 95 30 30" },
              { name: "Jean Louis David", location: "Angoulême", contact: "+33 5 45 92 04 04" },
              { name: "Franck Provost", location: "Angoulême", contact: "+33 5 45 95 25 25" },
              { name: "L'Atelier du Barbier", location: "Angoulême", contact: "+33 5 45 38 60 60" },
              { name: "Body Minute", location: "Angoulême", contact: "+33 5 45 92 15 15" },
            ],
          },
        ],
        balustradeUrl: asset("balustrade-florals.png"),
        poolsUrnUrl: asset("pools-urn.png"),
        columnVaseUrl: asset("column-vase.png"),
        fountainUrl: asset("fountain-urns.png"),
      },
    },
    {
      type: "gifts",
      props: {
        title: "Gifts",
        intro:
          "Your presence is the best gift — having you by our side on this special day is truly all we need. However, if you wish to give a gift, please see the details below:",
        cakeUrl: asset("gifts-cake.png"),
        tasselPinkUrl: asset("tassel-pink.png"),
        tasselGoldUrl: asset("tassel-gold.png"),
        bankDetails: {
          label: "Bank Transfer",
          bank: "Banque Placeholder SA",
          address: "12 Rue de l'Exemple, 75001 Paris, France",
          holders: "Lucia Doe and Matteo Rossi",
          iban: "FR76 3000 4000 5000 6000 7000 123",
          bic: "PLCHFRPPXXX",
        },
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        deadlineNote: "Please respond by",
        deadlineDate: "28 August 2026",
        floralFrameUrl: asset("floral-frame-bg.jpg"),
        chandelierUrl: asset("rsvp-chandelier.png"),
        chandelier2Url: asset("rsvp-chandelier-2.png"),
      },
    },
    {
      type: "credit",
      props: {
        names: "Lucia & Matteo",
        date: "July 27, 2027",
        venue: fullVenue,
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
        creditUrl: "https://thedigitalyes.com",
        chandelierUrl: asset("rsvp-chandelier.png"),
      },
    },
  ],
};

export const siteMeta = {
  id: "bridgerton",
  title: "Bridgerton",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/bridgerton/",
  summary:
    "Regency candlelit château wedding with hero video loop, chateau welcome, countdown, dress code, hotels, Nouvelle-Aquitaine guide, gifts and RSVP.",
  tags: ["video open", "music", "bridgerton", "countdown", "map", "regency", "chateau", "rsvp"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-poster.jpg"),
    accent: "#4a2b3d",
  },
};
