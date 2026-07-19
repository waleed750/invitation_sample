const coupleDancingUrl = "/assets/majestic/couple-dancing.png";
const footerOrnamentUrl = "/assets/majestic/footer-ornament.png";
const introPosterUrl = "/assets/media/intro-poster-new.jpg";
const introVideoUrl = "/assets/media/intro-video-new.mp4";
const musicUrl = "/assets/media/background-music.mp3";
const ornateBadgeUrl = "/assets/majestic/ornate-badge.png";
const stringLightsUrl = "/assets/majestic/string-lights.png";
const heroVideoUrl = "/assets/media/hero-video.mp4";

export const invitationData = {
  template: {
    eventType: "engagement",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "ornate",
  },
  theme: {
    background: "#fafaf5",
    foreground: "#5a6b50",
    muted: "#7e8d75",
    ivory: "#fffdf8",
  },
  couple: {
    firstName: "Abdelrahman",
    secondName: "Nourhan",
    headline: "We're Getting Engaged",
  },
  event: {
    date: "2026-06-20T20:00:00+03:00",
    displayDate: "20 June 2026",
    startTime: "8 PM",
    endTime: "12 AM",
    venue: "La Reine venue",
    mapUrl: "https://maps.app.goo.gl/r8MFkT4GcF5qgZFS7",
  },
  media: {
    introPosterUrl,
    introVideoUrl,
    heroVideoUrl,
    musicUrl,
    coupleDancingUrl,
    footerOrnamentUrl,
    ornateBadgeUrl,
    stringLightsUrl,
  },
  copy: {
    tapLabel: "Tap to open",
    welcomeTitle: "Welcome!",
    welcome:
      "In the quiet glow of a special evening, surrounded by the people we love, we begin a new chapter. We would be honoured to have you celebrate with us.",
    scheduleTitle: "Order of the Day",
    scheduleSubtitle: "What we have planned for you",
    detailsTitle: "The Details",
    detailsSubtitle: "Everything you need to know",
  },
  schedule: [
    { title: "Starts", description: "The celebration begins." },
    { title: "Dinner", description: "A special dinner with live music." },
    { title: "Ends", description: "Dancing into the late evening." },
  ],
  sections: [
    {
      type: "hero",
      props: {
        headline: "We're Getting Engaged",
        firstName: "Abdelrahman",
        secondName: "Nourhan",
        displayDate: "20 June 2026",
        heroVideoUrl,
      },
    },
    {
      type: "countdown",
      props: { date: "2026-06-20T20:00:00+03:00" },
    },
    {
      type: "imageDivider",
      props: { imageUrl: stringLightsUrl },
    },
    {
      type: "welcome",
      props: {
        title: "Welcome!",
        body: "In the quiet glow of a special evening, surrounded by the people we love, we begin a new chapter. We would be honoured to have you celebrate with us.",
      },
    },
    {
      type: "schedule",
      props: {
        title: "Order of the Day",
        subtitle: "What we have planned for you",
        items: [
          { title: "Starts", description: "The celebration begins." },
          { title: "Dinner", description: "A special dinner with live music." },
          { title: "Ends", description: "Dancing into the late evening." },
        ],
        coupleDancingUrl,
      },
    },
    {
      type: "details",
      props: {
        title: "The Details",
        subtitle: "Everything you need to know",
        venue: "La Reine venue",
        startTime: "8 PM",
        endTime: "12 AM",
        mapUrl: "https://maps.app.goo.gl/r8MFkT4GcF5qgZFS7",
        ornateBadgeUrl,
      },
    },
    {
      type: "map",
      props: {
        title: "La Reine venue map",
        src: "/maps/embed/index.html",
      },
    },
    {
      type: "messageForm",
      props: {
        title: "Leave a Message",
        subtitle: "Share your love, wishes, or a note for the happy couple.",
      },
    },
    {
      type: "footer",
      props: { ornamentUrl: footerOrnamentUrl },
    },
  ],
};

export const siteMeta = {
  id: "video-open-invitation",
  title: "Video Open Invitation",
  category: "Full Invitation",
  eventType: "Engagement",
  status: "Finished prototype",
  href: "/video-open-invitation/",
  summary: "Poster tap, intro video, music, fade transition, then scrollable engagement sections.",
  tags: ["video open", "music", "countdown", "map", "message form", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: invitationData.media.introPosterUrl,
    accent: "#5a6b50",
  },
};
