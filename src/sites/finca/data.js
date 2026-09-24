const asset = (name) => `/assets/finca/${name}`;

const address = "Finca Biniagual";
const addressQuery = encodeURIComponent(address);
const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
const mapEmbedSrc = `https://www.google.com/maps?q=${addressQuery}&output=embed`;
const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Mar%20%26%20Jaume&dates=20270508T170000Z/20270509T010000Z&location=Finca%20Biniagual";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "finca-rustic",
  },
  theme: {
    background: "#f1ebdf",
    foreground: "#3a4634",
    muted: "#87926c",
    ivory: "#f1ebdf",
  },
  couple: {
    firstName: "Mar",
    secondName: "Jaume",
    headline: "Nos casamos",
  },
  event: {
    date: "2027-05-08T17:00:00+02:00",
    displayDate: "8 de mayo de 2027",
    startTime: "17:00h",
    endTime: "01:00h",
    venue: address,
    mapUrl: mapSearchUrl,
    label: "Boda Mar & Jaume",
    location: address,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
    heroVideoUrl: asset("hero-video.mp4"),
    heroPosterUrl: asset("hero-poster.jpg"),
    musicUrl: asset("background-music.mp3"),
  },
  copy: {
    tapLabel: "Toca para abrir",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "Nos casamos",
        firstName: "Mar",
        secondName: "Jaume",
        displayDate: "8 de mayo de 2027",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("hero-poster.jpg"),
        ctaLabel: "Confirma tu asistencia",
        heroVideoLoop: true,
        showOverlayCopy: true,
      },
    },
    {
      type: "countdown",
      props: {
        date: "2027-05-08T17:00:00+02:00",
        title: "Cuenta atrás",
        untilLabel: "Para el día más especial de nuestras vidas",
        showSeconds: true,
      },
    },
    {
      type: "details",
      props: {
        title: "Detalles del día",
        subtitle: "Todo lo que necesitas saber",
        venue: address,
        startTime: "17:00h",
        endTime: "01:00h",
        mapSrc: mapEmbedSrc,
        mapSearchUrl,
        calendarUrl,
        venueImageUrl: asset("finca-biniagual.webp"),
        champagneUrl: asset("champagne-illustration.png"),
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "diamond",
      },
    },
    {
      type: "schedule",
      props: {
        title: "Programa del día",
        subtitle: "Lo que tenemos preparado para vosotros",
        illustrationUrl: asset("party-illustration.png"),
        items: [
          { time: "17:00", title: "Llegada de invitados", description: "Recepción y bienvenida en la finca" },
          { time: "17:30", title: "Welcome Drink", description: "Cóctel de bienvenida mientras esperamos" },
          { time: "18:00", title: "Ceremonia", description: "El momento más especial del día" },
          { time: "19:00", title: "Cóctel", description: "Aperitivos y bebidas en los jardines" },
          { time: "21:00", title: "Banquete", description: "Cena y celebración" },
          { time: "00:00", title: "Fiesta", description: "¡A bailar hasta el amanecer!" },
          { time: "03:00", title: "Fin de fiesta", description: "Despedida y buenos recuerdos" },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "diamond",
      },
    },
    {
      type: "hotelList",
      props: {
        title: "Alojamiento",
        subtitle: "Recomendaciones para tu estancia",
        hotels: [
          {
            name: "Agroturismo Es Quatre Cantons",
            description: "Más cerca de la boda",
            link: "https://maps.app.goo.gl/qd2FewV6G4LyeJwA8?g_st=ipc",
          },
          {
            name: "La Pérgola",
            description: "Alojamiento recomendado",
            link: "https://maps.app.goo.gl/YzWdsgTx8hJULbwRA?g_st=ipc",
          },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "diamond",
      },
    },
    {
      type: "gifts",
      props: {
        title: "Regalos",
        body: "Vuestra presencia es lo más importante para nosotros.\nSi deseáis hacernos un regalo, podéis hacerlo de la forma que os resulte más cómoda.",
        accordionTitle: "Aportación",
        cashNote: "Si lo preferís, el regalo puede ser en dinero en efectivo.",
        transferIntro: "En caso de que os resulte más cómodo, también podéis realizar una transferencia:",
        iban: "ES00 0000 0000 0000 0000 0000",
        confettiUrl: asset("confetti.gif"),
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "diamond",
      },
    },
    {
      type: "rsvp",
      props: {
        title: "Confirma tu asistencia",
        subtitle: "Esperamos contar contigo",
        ringsUrl: asset("rings-illustration.png"),
      },
    },
    {
      type: "credit",
      props: {
        names: "Mar & Jaume",
        date: "8 de mayo de 2027",
        loveLine: "Con todo nuestro amor",
        creditLine: "Hecho por",
        creditName: "The Digital Yes",
        creditUrl: "https://www.thedigitalyes.com",
      },
    },
  ],
};

export const siteMeta = {
  id: "finca",
  title: "Finca Biniagual",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/finca/",
  summary:
    "Sage finca wedding with intro video, countdown, venue map, 7-step day programme, accommodation cards, gifts accordion, and detailed RSVP with allergies.",
  tags: ["video open", "music", "finca", "countdown", "map", "schedule", "hotels", "gifts", "rsvp", "sage"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-poster.jpg"),
    accent: "#3a4634",
  },
};
