const asset = (name) => `/assets/floral/${name}`;

const address = "El Mirlo Blanco \u2013 Candeleda";
const addressQuery = encodeURIComponent(address);
const mapSearchUrl = `https://maps.app.goo.gl/EJyuWwXZkfYLLrjM8?g_st=iw`;
const mapEmbedSrc = `https://www.google.com/maps?q=${addressQuery}&output=embed`;
const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20Carla%20%26%20Miguel%20%C3%81ngel&dates=20261003T123000/20261003T183000&location=El%20Mirlo%20Blanco%20%E2%80%93%20Candeleda";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "floral-romantic",
  },
  theme: {
    background: "#fcfcfc",
    foreground: "#503035",
    muted: "#846267",
    ivory: "#fcfcfc",
  },
  couple: {
    firstName: "Carla",
    secondName: "Miguel \u00C1ngel",
    headline: "Save the Date",
  },
  event: {
    date: "2026-10-03T12:30:00+02:00",
    displayDate: "3 de octubre de 2026",
    startTime: "12:30h",
    endTime: null,
    venue: address,
    mapUrl: mapSearchUrl,
    label: "Save the Date",
    location: address,
  },
  media: {
    introPosterUrl: asset("intro-poster.jpg"),
    introVideoUrl: asset("intro-video.mp4"),
    heroVideoUrl: asset("hero-video.mp4"),
    heroPosterUrl: asset("hero-poster.jpg"),
    musicUrl: asset("background-music.mp3"),
    floralBorderUrl: asset("floral-border.png"),
  },
  copy: {
    tapLabel: "Toca para abrir",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "Save the Date",
        firstName: "Carla",
        secondName: "Miguel \u00C1ngel",
        subtitle: "\u00A1Nos casamos!",
        monthLabel: "OCTUBRE",
        dayLabel: "3",
        weekdayLabel: "S\u00C1BADO",
        yearLabel: "2026",
        heroVideoUrl: asset("hero-video.mp4"),
        heroPosterUrl: asset("hero-poster.jpg"),
        scrollCueLabel: "Confirmar asistencia",
        floralBorderUrl: asset("floral-border.png"),
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-10-03T12:30:00+02:00",
        kicker: "Cuenta atr\u00E1s",
        title: "Hasta el gran d\u00EDa",
        showSeconds: true,
      },
    },
    {
      type: "details",
      props: {
        kicker: "El lugar",
        title: "El lugar",
        subtitle: "Donde celebraremos nuestro amor",
        venue: address,
        time: "12:30h",
        mapSrc: mapEmbedSrc,
        mapSearchUrl,
        calendarUrl,
        ctaMapLabel: "C\u00F3mo llegar",
        ctaCalendarLabel: "A\u00F1adir al calendario",
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
        title: "Programa del d\u00EDa",
        subtitle: "Nuestra celebraci\u00F3n paso a paso",
        items: [
          { title: "Ceremonia" },
          { title: "C\u00F3ctel" },
          { title: "Comida" },
          { title: "Fiesta" },
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
        body: "Vuestra presencia es el mejor regalo que podemos recibir.\nSi dese\u00E1is contribuir a nuestro pr\u00F3ximo viaje juntos, pod\u00E9is hacerlo de la forma que os resulte m\u00E1s c\u00F3moda.",
        accordionTitle: "Aportaci\u00F3n",
        iban: "ES00 0000 0000 0000 0000 0000",
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
        nameFieldLabel: "Nombre completo *",
        dietaryPlaceholder: "Alergias o restricciones alimentarias",
        submitLabel: "Enviar confirmaci\u00F3n",
        guestCountMode: "stepper",
        showDietaryField: true,
        dietaryFieldLabel: "Alergias o restricciones",
        attendanceOptions: { yes: "S\u00ED", no: "No" },
      },
    },
    {
      type: "credit",
      props: {
        names: "Carla & Miguel \u00C1ngel",
        date: "3 de octubre de 2026",
        loveLine: "Con todo nuestro amor",
        creditLine: "Hecho con amor por",
        creditName: "The Digital Yes",
        creditUrl: "https://www.thedigitalyes.com",
      },
    },
  ],
};

export const siteMeta = {
  id: "floral",
  title: "Floral Romance",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/floral/",
  summary:
    "Romantic floral wedding with full-screen video hero, countdown, venue map, day programme, gifts accordion, and RSVP form.",
  tags: ["video open", "music", "floral", "countdown", "map", "schedule", "gifts", "rsvp", "romantic"],
  template: invitationData.template,
  preview: {
    imageUrl: asset("hero-poster.jpg"),
    accent: "#b46471",
  },
};
