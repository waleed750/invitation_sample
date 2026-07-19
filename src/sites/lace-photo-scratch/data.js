const introPosterUrl = "/assets/media/intro-poster-new.jpg";
const musicUrl = "/assets/media/background-music.mp3";
const footerOrnamentUrl = "/assets/majestic/footer-ornament.png";

export const laceScratchData = {
  template: {
    eventType: "save-the-date",
    siteType: "save-the-date",
    experienceType: "interactive-reveal",
    introType: "scratch-reveal",
    layoutFamily: "minimal-interactive",
  },
  theme: {
    background: "#f6eee0",
    foreground: "#5a4a3a",
    muted: "#9a8a78",
    ivory: "#fffdf8",
  },
  couple: {
    firstName: "Abdelrahman",
    secondName: "Nourhan",
  },
  event: {
    label: "Save the Date",
    date: "20 June 2026",
    location: "La Reine venue",
  },
  media: {
    photoUrl: introPosterUrl,
    musicUrl,
    ornamentUrl: footerOrnamentUrl,
  },
  copy: {},
  schedule: [],
  sections: [
    {
      type: "scratchReveal",
      props: {
        photoUrl: introPosterUrl,
        label: "Save the Date",
        firstName: "Abdelrahman",
        secondName: "Nourhan",
        date: "20 June 2026",
        location: "La Reine venue",
      },
    },
    {
      type: "footer",
      props: { ornamentUrl: footerOrnamentUrl },
    },
  ],
};

export const siteMeta = {
  id: "lace-photo-scratch",
  title: "Lace Photo Scratch",
  category: "Save The Date",
  eventType: "Save The Date",
  status: "Finished prototype",
  href: "/lace-photo-scratch/",
  summary: "Lace-inspired cover with wax-seal styling and a scratch-to-reveal interaction.",
  tags: ["scratch reveal", "lace", "single screen", "music", "interactive"],
  template: laceScratchData.template,
  preview: {
    imageUrl: laceScratchData.media.photoUrl,
    accent: "#b99d78",
  },
};
