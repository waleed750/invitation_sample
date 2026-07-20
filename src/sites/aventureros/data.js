const introPosterUrl = "/assets/aventureros/intro-poster.jpg";
const introVideoUrl = "/assets/aventureros/intro-video.mp4";
const heroVideoUrl = "/assets/aventureros/hero-video.mp4";
const musicUrl = "/assets/aventureros/background-music.mp3";
const rsvpConfirmationUrl = "/assets/aventureros/rsvp-confirmation.mp4";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "scroll-only",
    introType: "video-open",
    layoutFamily: "classic",
  },
  theme: {
    background: "#faf9f6",
    foreground: "#3a3a3a",
    muted: "#8a8a8a",
    ivory: "#f5f0e8",
  },
  couple: {
    firstName: "Maria",
    secondName: "Carlos",
    headline: "Nuestra próxima aventura juntos",
  },
  event: {
    date: "2026-06-20T16:30:00+02:00",
    displayDate: "20 de junio de 2026",
    startTime: "16:30",
    endTime: "02:30",
    venue: "Finca El Olivo",
    mapUrl: "https://maps.google.com/?q=Finca+El+Olivo+Mallorca",
    location: "Mallorca",
  },
  media: {
    introPosterUrl,
    introVideoUrl,
    heroVideoUrl,
    musicUrl,
    rsvpConfirmationUrl,
  },
  copy: {
    tapLabel: "Confirma asistencia",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "Nuestra próxima aventura juntos",
        firstName: "Maria",
        secondName: "Carlos",
        displayDate: "20 de junio de 2026",
        heroVideoUrl,
        ctaLabel: "Confirma asistencia",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-06-20T16:30:00+02:00",
        title: "Despegue en",
        untilLabel: "Nuestra próxima aventura",
      },
    },
    {
      type: "details",
      props: {
        title: "Destino",
        subtitle: "Coordenadas del encuentro",
        venue: "Finca El Olivo",
        location: "Mallorca",
        startTime: "16:30h",
        endTime: "02:30h",
        mapUrl: "https://maps.google.com/?q=Finca+El+Olivo+Mallorca",
        calendarLabel: "Añadir al calendario",
      },
    },
    {
      type: "schedule",
      props: {
        title: "Itinerario de vuelo",
        subtitle: "Nuestro plan de viaje para el gran día",
        items: [
          { title: "16:30", description: "Llegada", time: "Check-in de viajeros" },
          { title: "17:00", description: "Ceremonia", time: "Nos embarcamos juntos" },
          { title: "18:00", description: "Cóctel", time: "Primera escala" },
          { title: "20:00", description: "Cena", time: "Banquete de altura" },
          { title: "22:30", description: "Primer baile", time: "Nuestro despegue" },
          { title: "23:00", description: "Fiesta", time: "¡Turbulencias de baile!" },
          { title: "02:30", description: "Aterrizaje", time: "Hasta el próximo viaje" },
        ],
      },
    },
    {
      type: "gifts",
      props: {
        title: "Regalos",
        body: "Vuestra presencia es el mejor regalo que podemos recibir.\nSi deseáis contribuir a nuestro próximo viaje juntos, podéis hacerlo de la forma que os resulte más cómoda.",
        buttonLabel: "Aportación",
        buttonUrl: "#",
      },
    },
    {
      type: "rsvp",
      props: {
        title: "Confirma tu asistencia",
        subtitle: "Esperamos contar contigo",
        confirmationVideoUrl: rsvpConfirmationUrl,
      },
    },
    {
      type: "footer",
      props: {
        names: "Maria & Carlos",
        date: "20 de junio de 2026",
        creditLine: "Hecho con amor por",
        creditName: "The Digital Yes",
      },
    },
  ],
};

export const siteMeta = {
  id: "aventureros",
  title: "Boda Laura & Javier",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/aventureros/",
  summary: "Spanish-language wedding invitation: envelope video intro, countdown, flight-themed schedule, gifts, RSVP with confirmation animation.",
  tags: ["video open", "music", "countdown", "rsvp", "gifts", "spanish", "wedding", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: "/assets/aventureros/intro-poster.jpg",
    accent: "#c4a882",
  },
};
