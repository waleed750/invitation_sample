import {type InvitationData, parseInvitationData} from '@platform/shared';

const rawData: InvitationData = {
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
    firstName: {ar: "محمد", en: "Mohamad"},
    secondName: {ar: "سلمى", en: "Salma"},
    headline: {ar: "نحتفل بزفافنا", en: "We're getting married"},
  },
  event: {
    date: "2026-08-20T20:00:00+02:00",
  },
  media: {
    introPosterUrl: "/assets/drafts/citystars/intro-poster.jpg",
    introVideoUrl: "/assets/drafts/citystars/intro-video.mp4",
    musicUrl: "/assets/drafts/citystars/background-music.mp3",
  },
  copy: {
    tapLabel: {ar: "اضغط للفتح", en: "Tap to open"},
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: {ar: "نحتفل بزفافنا", en: "We're getting married"},
        firstName: {ar: "محمد", en: "Mohamad"},
        secondName: {ar: "سلمى", en: "Salma"},
        displayDate: {ar: "20 أغسطس 2026", en: "20 August 2026"},
        heroVideoUrl: "/assets/drafts/citystars/hero-video.mp4",
        heroPosterUrl: "/assets/drafts/citystars/intro-poster.jpg",
        heroVideoLoop: true,
        showOverlayCopy: true,
        scrollCueLabel: {ar: "مرر للأسفل", en: "Scroll"},
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-08-20T20:00:00+02:00",
        title: {ar: "العد التنازلي", en: "Countdown"},
        untilLabel: {ar: "حتى 20 أغسطس 2026", en: "Until 20 August 2026"},
        showSeconds: false,
      },
    },
    {
      type: "welcome",
      props: {
        title: {ar: "مرحباً!", en: "Welcome!"},
        body: {
          ar: "ندعوكم بحرارة للاحتفال بيوم زفافنا معنا. نتطلع إلى مشاركة هذه اللحظة التي لا تُنسى مع أقرب الناس إلى قلوبنا.",
          en: "We warmly invite you to celebrate our wedding day with us. We look forward to sharing this unforgettable moment with our most special people."
        },
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/citystars/floral-vase.png",
        line: true,
      },
    },
    {
      type: "details",
      props: {
        title: {ar: "المكان", en: "The Venue"},
        subtitle: {ar: "حيث نحتفل", en: "Where we celebrate"},
        venue: {ar: "إنتركونتيننتال سيتي ستارز القاهرة", en: "InterContinental Citystars Cairo"},
        dateLine: {ar: "20 أغسطس 2026 · في تمام الساعة الثامنة مساءً", en: "20 August 2026 · At Eight O'Clock in the Evening"},
        addressLines: [
          {ar: "القاهرة، مصر", en: "Cairo, Egypt"}
        ],
        mapUrl: "https://www.google.com/maps/search/?api=1&query=InterContinental+Citystars+Cairo",
        mapLabel: {ar: "افتح في الخرائط", en: "Open in Maps"},
        startTime: {ar: "", en: ""},
        endTime: {ar: "", en: ""},
      },
    },
    {
      type: "schedule",
      props: {
        title: {ar: "برنامج اليوم", en: "Day Programme"},
        subtitle: {ar: "20 أغسطس 2026", en: "20 August 2026"},
        alternate: true,
        items: [
          { time: {ar: "8:00م", en: "8:00 PM"}, title: {ar: "الاستقبال", en: "Entrance"} },
          { time: {ar: "8:30م", en: "8:30 PM"}, title: {ar: "العشاء", en: "Dinner"} },
          { time: {ar: "9:00م", en: "9:00 PM"}, title: {ar: "الرقص", en: "Dancing"} },
          { time: {ar: "10:00م", en: "10:00 PM"}, title: {ar: "استراحة", en: "Break"} },
          { time: {ar: "10:30م", en: "10:30 PM"}, title: {ar: "تقطيع الكيك", en: "Cake Cutting"} },
          { time: {ar: "11:30م", en: "11:30 PM"}, title: {ar: "الوداع", en: "Farewell"} },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/citystars/champagne-tower.png",
      },
    },
    {
      type: "dressCode",
      props: {
        title: {ar: "قواعد اللباس", en: "Dress Code"},
        body: {ar: "", en: ""},
        groups: [
          { heading: {ar: "السيدات", en: "Women"}, body: {ar: "فستان كوكتيل أو رسمي", en: "Cocktail or formal dress"} },
          { heading: {ar: "الرجال", en: "Men"}, body: {ar: "بدلة داكنة وربطة عنق", en: "Dark suit and tie"} },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/citystars/bow-illustration.png",
      },
    },
    {
      type: "gifts",
      props: {
        title: {ar: "الهدايا", en: "Gifts"},
        body: {ar: "حضوركم هو أعظم هدية لنا.", en: "Your presence is our greatest gift."},
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/citystars/wedding-rings.png",
      },
    },
    {
      type: "map",
      props: {
        title: {ar: "إنتركونتيننتال سيتي ستارز القاهرة", en: "InterContinental Citystars Cairo"},
        src: "https://www.google.com/maps?q=InterContinental+Citystars+Cairo&output=embed",
      },
    },
    {
      type: "credit",
      props: {
        name: {ar: "وليد أشرف", en: "Waleed Ashraf"},
        portfolioUrl: "https://waleed-ashraf.vercel.app/",
        portfolioLabel: {ar: "معرض الأعمال", en: "Portfolio"},
        coupleNames: {ar: "محمد وسلمى", en: "Mohamad & Salma"},
        eventDate: {ar: "20 أغسطس 2026", en: "20 August 2026"},
      },
    },
  ],
};

const result = parseInvitationData(rawData);
if (!result.ok) {
  throw new Error(`Citystars data validation failed: ${JSON.stringify(result.errors, null, 2)}`);
}
export const getCitystarsData = () => result.data;
