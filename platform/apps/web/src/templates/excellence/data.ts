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
    background: "#f6f4ee",
    foreground: "#3a5542",
    muted: "#e7e2da",
    ivory: "#f6f4ee",
  },
  couple: {
    firstName: {ar: "محمد", en: "Mohamad"},
    secondName: {ar: "سلمى", en: "Salma"},
    headline: {ar: "نحتفل بزفافنا", en: "We are getting married"},
  },
  event: {
    date: "2026-08-20T18:00:00+03:00",
  },
  media: {
    introPosterUrl: "/assets/drafts/excellence/intro-poster.jpg",
    introVideoUrl: "/assets/drafts/excellence/intro-video.mp4",
    musicUrl: "/assets/drafts/excellence/background-music.mp3",
  },
  copy: {
    tapLabel: {ar: "اضغط للفتح", en: "Tap to open"},
  },
  sections: [
    {
      type: "hero",
      props: {
        heroVideoUrl: "/assets/drafts/excellence/hero-video.mp4",
        heroPosterUrl: "/assets/drafts/excellence/intro-poster.jpg",
        heroVideoLoop: false,
        showOverlayCopy: true,
        headline: {ar: "نحتفل بزفافنا", en: "We are getting married"},
        displayDate: {ar: "20 أغسطس 2026", en: "20 August 2026"},
        firstName: {ar: "محمد", en: "Mohamad"},
        secondName: {ar: "سلمى", en: "Salma"},
        overlayFadeOutAt: 4,
        scrollCueLabel: {ar: "مرر للأسفل وتأكيد الحضور", en: "Keep scrolling and RSVP"},
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-08-20T18:00:00+03:00",
        title: {ar: "العد التنازلي", en: "Countdown"},
        untilLabel: {ar: "حتى 20 أغسطس 2026", en: "Until 20 August 2026"},
        columnLeftUrl: "/assets/drafts/excellence/column-left.png",
        columnRightUrl: "/assets/drafts/excellence/column-right.png",
        showSeconds: false,
      },
    },
    {
      type: "welcome",
      props: {
        title: {ar: "الاحتفالات", en: "The Celebrations"},
        body: {ar: "", en: ""},
        cards: [
          {
            kicker: {ar: "رحلة بحرية ترحيبية في البوسفور", en: "Welcome Cruise on the Bosphorus"},
            heading: {ar: "الرصيف الخاص لفندق بينينسولا", en: "The Peninsula Private Quay"},
            body: {ar: "المغادرة من الرصيف الخاص لفندق بينينسولا", en: "Departing from The Peninsula Private Quay"},
            date: {ar: "19 أغسطس 2026", en: "19 August 2026"},
            time: {ar: "6:30 مساءً", en: "6:30 PM"},
            mapUrl: "https://www.google.com/maps/place/The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul/@41.0230125,28.9779274,17z",
            imageUrl: "/assets/drafts/excellence/yacht-illustration.png",
          },
          {
            kicker: {ar: "الزفاف", en: "Wedding"},
            heading: {ar: "فندق بينينسولا إسطنبول", en: "The Peninsula Hotel Istanbul"},
            date: {ar: "20 أغسطس 2026", en: "20 August 2026"},
            time: {ar: "6:00 مساءً", en: "6:00 PM"},
            mapUrl: "https://www.google.com/maps/place/The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul/@41.0230125,28.9779274,17z",
            imageUrl: "/assets/drafts/excellence/peninsula-hotel.png",
          },
        ],
      },
    },
    {
      type: "schedule",
      props: {
        title: {ar: "عطلة نهاية أسبوع الزفاف", en: "Wedding Weekend"},
        subtitle: {ar: "جدول الفعاليات\n19 – 20 أغسطس 2026", en: "Itinerary\n19 – 20 August 2026"},
        items: [
          {
            title: {ar: "رحلة بحرية ترحيبية في البوسفور", en: "Welcome Cruise on the Bosphorus"},
            subtitle: {ar: "19 أغسطس 2026\nيرجى الانضمام إلينا لتناول الكوكتيلات والمقبلات أثناء إبحارنا في البوسفور", en: "19 August 2026\nPlease join us for cocktails and hors d'œuvres as we sail the Bosphorus"},
            stops: [
              { time: {ar: "6:30 مساءً", en: "6:30 PM"}, text: {ar: "المغادرة من الرصيف الخاص لفندق بينينسولا", en: "Departure from The Peninsula Private Quay"} },
              { time: {ar: "6:30 – 9:30 مساءً", en: "6:30 – 9:30 PM"}, text: {ar: "كوكتيلات ومقبلات وقت الغروب", en: "Sunset Cocktails & Hors d'Œuvres"} },
              { time: {ar: "10:00 مساءً", en: "10:00 PM"}, text: {ar: "الوصول إلى الرصيف الخاص لفندق بينينسولا", en: "Arrival at The Peninsula Private Quay"} },
            ],
          },
          {
            title: {ar: "الزفاف", en: "Wedding"},
            subtitle: {ar: "20 أغسطس 2026 · فندق بينينسولا إسطنبول", en: "20 August 2026 · The Peninsula Hotel Istanbul"},
            stops: [
              { time: {ar: "6:00 مساءً", en: "6:00 PM"}, text: {ar: "الوصول ومشروبات الترحيب", en: "Arrival & Welcome Drinks"} },
              { text: {ar: "مراسم الزفاف", en: "Ceremony"} },
              { text: {ar: "الوليمة", en: "Banquet"} },
              { text: {ar: "الحفلة", en: "Party"} },
              { text: {ar: "حفلة ما بعد الزفاف", en: "After Party"} },
            ],
          },
        ],
        bgUrl: "/assets/drafts/excellence/candles.png",
      },
    },
    {
      type: "dressCode",
      props: {
        title: {ar: "قواعد اللباس", en: "Dress Code"},
        body: {ar: "", en: ""},
        cards: [
          {
            heading: {ar: "رحلة بحرية ترحيبية", en: "Welcome Cruise"},
            date: {ar: "19 أغسطس", en: "19TH AUGUST"},
            attire: {ar: "ملابس كوكتيل بيضاء", en: "White Cocktail Attire"},
            imageUrl: "/assets/drafts/excellence/bouquet.png",
          },
          {
            heading: {ar: "الزفاف", en: "Wedding"},
            date: {ar: "20 أغسطس", en: "20TH AUGUST"},
            attire: {ar: "ملابس رسمية (بلاك تاي)", en: "Black Tie"},
            imageUrl: "/assets/drafts/excellence/cypress-trees.png",
          },
        ],
      },
    },
    {
      type: "map",
      props: {
        title: {ar: "فندق بينينسولا إسطنبول", en: "The Peninsula Hotel Istanbul"},
        src: "https://www.google.com/maps?q=The+Peninsula+Istanbul,+Kemanke%C5%9F+Karamustafa+Pa%C5%9Fa,+Kemanke%C5%9F+Cd.+No:34,+34425+Beyo%C4%9Flu%2F%C4%B0stanbul&output=embed",
      },
    },
    {
      type: "gifts",
      props: {
        title: {ar: "هدية الزفاف", en: "Wedding Gift"},
        body: {
          ar: "حضوركم هو أعظم هدية لنا.\n\nإذا كنتم ترغبون في تقديم هدية لنا، نفضل المساهمات النقدية. سيتم مشاركة التفاصيل البنكية بشكل منفصل.",
          en: "Your presence is our greatest gift.\n\nIf you wish to honour us with a gift, we kindly prefer monetary contributions. Bank details will be shared separately."
        },
        bgUrl: "/assets/drafts/excellence/roses-top-left.png",
      },
    },
    {
      type: "rsvp",
      props: {
        title: {ar: "تأكيد الحضور", en: "RSVP"},
        subtitle: {ar: "نرجو منكم التكرم بالرد بحلول الخامس عشر من يونيو 2026", en: "The favour of a reply is kindly requested by the fifteenth of June, 2026"},
        bgUrl: "/assets/drafts/excellence/vase-left.png",
        bottomUrl: "/assets/drafts/excellence/vase-right.png",
        attendanceOptions: {
          yes: {ar: "يسعدني الحضور", en: "Delighted to accept"},
          no: {ar: "للأسف لن أتمكن من الحضور", en: "Regretfully unable to attend"},
        },
        eventOptions: [
          { label: {ar: "رحلة بحرية ترحيبية - 19 أغسطس", en: "Welcome Cruise - 19th August"}, value: "welcome-cruise" },
          { label: {ar: "مراسم الزفاف وحفل الاستقبال - 20 أغسطس", en: "Wedding Ceremony & Reception - 20th August"}, value: "wedding" },
        ],
        guestCountMode: "stepper",
        nameFieldLabel: {ar: "الضيف الرئيسي", en: "Principal guest"},
        childrenMode: "radios",
        childrenLabel: {ar: "هل سيرافقكم أي أطفال؟", en: "Will any children be accompanying you?"},
        submitLabel: {ar: "إرسال الرد", en: "SUBMIT RESPONSE"},
      },
    },
    {
      type: "credit",
      props: {
        name: {ar: "وليد أشرف", en: "Waleed Ashraf"},
        portfolioUrl: "https://waleed-ashraf.vercel.app/",
        portfolioLabel: {ar: "معرض الأعمال", en: "Portfolio"},
        monogramUrl: "/assets/drafts/excellence/monogram.png",
        coupleNames: {ar: "محمد وسلمى", en: "Mohamad & Salma"},
        eventDate: {ar: "20 أغسطس 2026", en: "20 August 2026"},
      },
    },
  ],
};

const result = parseInvitationData(rawData);
if (!result.ok) {
  throw new Error(`Excellence data validation failed: ${JSON.stringify(result.errors, null, 2)}`);
}
export const getExcellenceData = () => result.data;
