import {parseInvitationData, type InvitationData} from '@platform/shared';

const coupleDancingUrl = "/assets/demo/video-open/couple-dancing.png";
const footerOrnamentUrl = "/assets/demo/video-open/footer-ornament.png";
const introPosterUrl = "/assets/demo/video-open/intro-poster-new.jpg";
const introVideoUrl = "/assets/demo/video-open/intro-video-new.mp4";
const musicUrl = "/assets/demo/video-open/background-music.mp3";
const ornateBadgeUrl = "/assets/demo/video-open/ornate-badge.png";
const stringLightsUrl = "/assets/demo/video-open/string-lights.png";
const heroVideoUrl = "/assets/demo/video-open/hero-video.mp4";

export const videoOpenData: InvitationData = {
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
    firstName: {"ar": "Abdelrahman", "en": "Abdelrahman"},
    secondName: {"ar": "Nourhan", "en": "Nourhan"},
    headline: {"ar": "نحتفل بخطوبتنا", "en": "We're Getting Engaged"},
  },
  event: {
    date: "2026-06-20T20:00:00+03:00",
    displayDate: {"ar": "20 يونيو 2026", "en": "20 June 2026"},
    startTime: {"ar": "8 مساءً", "en": "8 PM"},
    endTime: {"ar": "12 منتصف الليل", "en": "12 AM"},
    venue: {"ar": "قاعة لا رين", "en": "La Reine venue"},
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
    tapLabel: {"ar": "اضغط لفتح الدعوة", "en": "Tap to open"},
    welcomeTitle: {"ar": "أهلًا وسهلًا!", "en": "Welcome!"},
    welcome:
      {"ar": "في أجواء أمسية مميزة، وبين من نحب، نبدأ فصلًا جديدًا من حياتنا. يشرفنا أن تشاركونا فرحتنا.", "en": "In the quiet glow of a special evening, surrounded by the people we love, we begin a new chapter. We would be honoured to have you celebrate with us."},
    scheduleTitle: {"ar": "برنامج الحفل", "en": "Order of the Day"},
    scheduleSubtitle: {"ar": "ما أعددناه لكم", "en": "What we have planned for you"},
    detailsTitle: {"ar": "تفاصيل الحفل", "en": "The Details"},
    detailsSubtitle: {"ar": "كل ما تحتاجون إلى معرفته", "en": "Everything you need to know"},
  },
  schedule: [
    { title: {"ar": "البداية", "en": "Starts"}, description: {"ar": "تبدأ الاحتفالات.", "en": "The celebration begins."} },
    { title: {"ar": "العشاء", "en": "Dinner"}, description: {"ar": "عشاء مميز على أنغام الموسيقى الحية.", "en": "A special dinner with live music."} },
    { title: {"ar": "الختام", "en": "Ends"}, description: {"ar": "نرقص معًا حتى وقت متأخر من المساء.", "en": "Dancing into the late evening."} },
  ],
  sections: [
    {
      type: "hero",
      props: {
        headline: {"ar": "نحتفل بخطوبتنا", "en": "We're Getting Engaged"},
        firstName: {"ar": "Abdelrahman", "en": "Abdelrahman"},
        secondName: {"ar": "Nourhan", "en": "Nourhan"},
        displayDate: {"ar": "20 يونيو 2026", "en": "20 June 2026"},
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
        title: {"ar": "أهلًا وسهلًا!", "en": "Welcome!"},
        body: {"ar": "في أجواء أمسية مميزة، وبين من نحب، نبدأ فصلًا جديدًا من حياتنا. يشرفنا أن تشاركونا فرحتنا.", "en": "In the quiet glow of a special evening, surrounded by the people we love, we begin a new chapter. We would be honoured to have you celebrate with us."},
      },
    },
    {
      type: "schedule",
      props: {
        title: {"ar": "برنامج الحفل", "en": "Order of the Day"},
        subtitle: {"ar": "ما أعددناه لكم", "en": "What we have planned for you"},
        items: [
          { title: {"ar": "البداية", "en": "Starts"}, description: {"ar": "تبدأ الاحتفالات.", "en": "The celebration begins."} },
          { title: {"ar": "العشاء", "en": "Dinner"}, description: {"ar": "عشاء مميز على أنغام الموسيقى الحية.", "en": "A special dinner with live music."} },
          { title: {"ar": "الختام", "en": "Ends"}, description: {"ar": "نرقص معًا حتى وقت متأخر من المساء.", "en": "Dancing into the late evening."} },
        ],
        coupleDancingUrl,
      },
    },
    {
      type: "details",
      props: {
        title: {"ar": "تفاصيل الحفل", "en": "The Details"},
        subtitle: {"ar": "كل ما تحتاجون إلى معرفته", "en": "Everything you need to know"},
        venue: {"ar": "قاعة لا رين", "en": "La Reine venue"},
        startTime: {"ar": "8 مساءً", "en": "8 PM"},
        endTime: {"ar": "12 منتصف الليل", "en": "12 AM"},
        mapUrl: "https://maps.app.goo.gl/r8MFkT4GcF5qgZFS7",
        ornateBadgeUrl,
      },
    },
    {
      type: "map",
      props: {
        title: {"ar": "خريطة قاعة لا رين", "en": "La Reine venue map"},
        src: "https://www.google.com/maps?q=30.0216672,31.3638713&output=embed",
      },
    },
    {
      type: "messageForm",
      props: {
        title: {"ar": "اترك رسالة", "en": "Leave a Message"},
        subtitle: {"ar": "شاركونا محبتكم وأمنياتكم أو اتركوا كلمة للعروسين.", "en": "Share your love, wishes, or a note for the happy couple."},
      },
    },
    {
      type: "footer",
      props: { ornamentUrl: footerOrnamentUrl },
    },
  ],
};


export function getVideoOpenData(): InvitationData {
  const result = parseInvitationData(videoOpenData);
  if (!result.ok) throw new Error(`Invalid video-open demo: ${JSON.stringify(result.errors)}`);
  return result.data;
}
