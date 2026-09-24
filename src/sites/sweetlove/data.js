const asset = (name) => `/assets/sweetlove/${name}`;

const address = "Masia Can Cortada, Barcelona";
const addressQuery = encodeURIComponent(address);
const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
const mapEmbedSrc = `https://www.google.com/maps?q=${addressQuery}&output=embed`;
const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Laura%20%26%20Javier&dates=20260518T163000Z/20260519T023000Z&location=Masia%20Can%20Cortada%2C%20Barcelona";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "sweetlove-romantic",
  },
  theme: {
    background: "#ffffff",
    foreground: "#262626",
    muted: "#727272",
    ivory: "#f8f5f0",
  },
  couple: {
    firstName: "Laura",
    secondName: "Javier",
    headline: "Nos casamos",
  },
  event: {
    date: "2026-05-18T16:30:00+02:00",
    displayDate: "18 de mayo de 2026",
    startTime: "16:30h",
    endTime: "02:30h",
    venue: "Masia Can Cortada",
    mapUrl: mapSearchUrl,
    label: "Boda Laura & Javier",
    location: address,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
    heroVideoUrl: asset("hero-video.mp4"),
    heroPosterUrl: asset("hero-poster.jpg"),
    musicUrl: asset("background-music.mp3"),
    confettiUrl: asset("confetti.gif"),
    rsvpConfirmationVideoUrl: asset("rsvp-confirmation.mp4"),
  },
  copy: {
    tapLabel: "Toca para abrir",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "Nos casamos",
        firstName: "Laura",
        secondName: "Javier",
        displayDate: "18 de mayo de 2026",
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
        date: "2026-05-18T16:30:00+02:00",
        kicker: "Cuenta atrás",
        title: "Para el día más especial",
        showSeconds: true,
      },
    },
    {
      type: "details",
      props: {
        title: "Detalles del día",
        subtitle: "Todo lo que necesitas saber",
        venue: "Masia Can Cortada",
        address,
        startTime: "16:30h",
        endTime: "02:30h",
        mapSrc: mapEmbedSrc,
        mapSearchUrl,
        calendarUrl,
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "heart",
      },
    },
    {
      type: "schedule",
      props: {
        title: "Programa del día",
        subtitle: "Lo que tenemos preparado para vosotros",
        items: [
          { time: "16:30", title: "Llegada de invitados", description: "Recepción y bienvenida" },
          { time: "17:00", title: "Ceremonia", description: "Boda civil" },
          { time: "18:00", title: "Cóctel", description: "Aperitivos y bebidas" },
          { time: "20:00", title: "Cena", description: "Banquete nupcial" },
          { time: "22:30", title: "Primer baile", description: "El baile de los novios" },
          { time: "23:00", title: "Fiesta", description: "¡A bailar!" },
          { time: "02:30", title: "Fin", description: "Despedida" },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        variant: "heart",
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
        variant: "heart",
      },
    },
    {
      type: "rsvp",
      props: {
        title: "Confirma tu asistencia",
        subtitle: "Esperamos contar contigo",
        rsvpConfirmationVideoUrl: asset("rsvp-confirmation.mp4"),
      },
    },
    {
      type: "credit",
      props: {
        names: "Laura & Javier",
        date: "18 de mayo de 2026",
        loveLine: "Con todo nuestro amor",
        creditLine: "Hecho con amor por",
        creditName: "The Digital Yes",
        creditUrl: "https://www.thedigitalyes.com",
      },
    },
  ],
};

export const siteMeta = {
  id: "dulce-amor",
  title: "Dulce Amor",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/dulce-amor/",
  summary:
    "Warm ivory wedding with envelope video intro, floral hero video, countdown, venue map, 7-step programme, gifts accordion with confetti, and detailed RSVP with allergies.",
  tags: ["video open", "music", "sweetlove", "countdown", "map", "schedule", "gifts", "rsvp", "romantic"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-poster.jpg"),
    accent: "#333333",
  },
};
