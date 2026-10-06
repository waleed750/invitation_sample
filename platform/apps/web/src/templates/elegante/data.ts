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
    firstName: {ar: "أندريا", en: "Andrea"},
    secondName: {ar: "بيدرو", en: "Pedro"},
    headline: {ar: "نحتفل بزفافنا", en: "We're getting married"},
  },
  event: {
    date: "2026-09-12T14:00:00+02:00",
  },
  media: {
    introPosterUrl: "/assets/drafts/elegante/intro-poster.jpg",
    introVideoUrl: "/assets/drafts/elegante/intro-video.mp4",
  },
  copy: {
    tapLabel: {ar: "اضغط للفتح", en: "Tap to open"},
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: {ar: "نحتفل بزفافنا", en: "We're getting married"},
        firstName: {ar: "أندريا", en: "Andrea"},
        secondName: {ar: "بيدرو", en: "Pedro"},
        displayDate: {ar: "12 سبتمبر 2026", en: "12 September 2026"},
        heroVideoUrl: "/assets/drafts/elegante/hero-video.mp4",
        heroPosterUrl: "/assets/drafts/elegante/intro-poster.jpg",
        heroVideoLoop: true,
        showOverlayCopy: true,
        scrollCueLabel: {ar: "تأكيد الحضور", en: "RSVP"},
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-09-12T14:00:00+02:00",
        title: {ar: "العد التنازلي", en: "Countdown"},
        untilLabel: {ar: "حتى 12 سبتمبر 2026", en: "Until 12 September 2026"},
        showSeconds: false,
      },
    },
    {
      type: "welcome",
      props: {
        title: {ar: "مرحباً!", en: "Welcome!"},
        body: {
          ar: "ندعوكم بحرارة للاحتفال بيوم زفافنا معنا في مدينة روندا الجميلة، في الأندلس. نتطلع إلى مشاركة هذه اللحظة التي لا تُنسى مع أقرب الناس إلى قلوبنا.",
          en: "We warmly invite you to celebrate our wedding day with us in the beautiful town of Ronda, Andalusia. We look forward to sharing this unforgettable moment with our most special people."
        },
      },
    },
    {
      type: "gallery",
      props: {
        images: Array.from({ length: 10 }, (_, index) => `/assets/drafts/elegante/gallery-${index + 1}.jpg`),
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/floral-vase.png",
        line: true,
      },
    },
    {
      type: "details",
      props: {
        title: {ar: "المكان", en: "The Venue"},
        subtitle: {ar: "حيث نحتفل", en: "Where we celebrate"},
        venue: {ar: "فينكا إل أوليفار", en: "Finca El Olivar"},
        dateLine: {ar: "12 سبتمبر 2026 · 14:00", en: "12 September 2026 · 14:00"},
        addressLines: [
          {ar: "كامينو دي لوس أوليفوس، روندا", en: "Camino de los Olivos s/n, Ronda"},
          {ar: "مالقة، 29400 – إسبانيا", en: "Málaga, 29400 – España"}
        ],
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Finca+El+Olivar+Ronda+Malaga+Spain",
        mapLabel: {ar: "افتح في الخرائط", en: "Open in Maps"},
        imageUrl: "/assets/drafts/elegante/venue-hedsor.png",
        startTime: {ar: "", en: ""},
        endTime: {ar: "", en: ""},
      },
    },
    {
      type: "schedule",
      props: {
        title: {ar: "برنامج اليوم", en: "Day Programme"},
        subtitle: {ar: "12 سبتمبر 2026", en: "12 September 2026"},
        bgUrl: "/assets/drafts/elegante/white-textured-paper.png",
        alternate: true,
        items: [
          { time: {ar: "14:00", en: "14:00"}, title: {ar: "الوصول", en: "Arrival"} },
          { time: {ar: "14:30", en: "14:30"}, title: {ar: "مراسم الزفاف", en: "Ceremony"} },
          { time: {ar: "16:00", en: "16:00"}, title: {ar: "الكوكتيلات", en: "Cocktails"} },
          { time: {ar: "18:00", en: "18:00"}, title: {ar: "العشاء", en: "Dinner"} },
          { time: {ar: "20:00", en: "20:00"}, title: {ar: "تقطيع الكيك", en: "Cutting the Cake"} },
          { time: {ar: "00:00", en: "00:00"}, title: {ar: "الختام", en: "Finish"} },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/champagne-tower.png",
      },
    },
    {
      type: "dressCode",
      props: {
        title: {ar: "قواعد اللباس", en: "Dress Code"},
        body: {ar: "", en: ""},
        illustrationUrl: "/assets/drafts/elegante/venue-hedsor-front.png",
        groups: [
          { heading: {ar: "السيدات", en: "Women"}, body: {ar: "فستان كوكتيل أو رسمي", en: "Cocktail or formal dress"} },
          { heading: {ar: "الرجال", en: "Men"}, body: {ar: "بدلة داكنة وربطة عنق", en: "Dark suit and tie"} },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/bow-illustration.png",
      },
    },
    {
      type: "welcome",
      props: {
        title: {ar: "تعالوا لإلقاء التحية...", en: "Come Say Hello..."},
        body: {
          ar: "هذه تجمعات غير رسمية، فلا تترددوا في الانضمام إلينا إذا كنتم في المنطقة.",
          en: "These are informal gatherings, so feel free to join us if you're in the area."
        },
        cards: [
          {
            imageUrl: "/assets/drafts/elegante/sunday-lunch-illustration.png",
            heading: {ar: "مشروبات الترحيب", en: "Welcome Drinks"},
            date: {ar: "الجمعة، 11 سبتمبر 2026", en: "Friday, September 11th, 2026"},
            time: {ar: "8:00 مساءً", en: "8:00 PM"},
            body: {ar: "بوديجا غارسيا هيدالغو، روندا", en: "Bodega García Hidalgo, Ronda"},
          },
          {
            imageUrl: "/assets/drafts/elegante/teacup-illustration.png",
            heading: {ar: "فطور الوداع", en: "Farewell Brunch"},
            date: {ar: "الأحد، 13 سبتمبر 2026", en: "Sunday, September 13th, 2026"},
            time: {ar: "12:00 مساءً", en: "12:00 PM"},
            body: {ar: "بارادور دي روندا (التراس)", en: "Parador de Ronda (terrace)"},
          },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/cupid-illustration.png",
      },
    },
    {
      type: "locationTransport",
      props: {
        title: {ar: "الموقع والنقل", en: "Location & Transportation"},
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Finca+El+Olivar+Ronda+Malaga+Spain",
        address: {ar: "فينكا إل أوليفار، كامينو دي لوس أوليفوس، 29400 روندا، مالقة – إسبانيا", en: "Finca El Olivar, Camino de los Olivos s/n, 29400 Ronda, Málaga – Spain"},
        directions: [
          {ar: "من مالقة: حوالي ساعة ونصف عبر A-357 و A-367", en: "From Málaga: ~1h 30min via A-357 and A-367"},
          {ar: "من إشبيلية: حوالي ساعتين عبر A-376", en: "From Seville: ~2h via A-376"},
          {ar: "من ماربيا: حوالي ساعة عبر A-397", en: "From Marbella: ~1h via A-397"},
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/matchbox-illustration.png",
      },
    },
    {
      type: "hotelList",
      props: {
        title: {ar: "أماكن الإقامة", en: "Accommodation"},
        subtitle: {ar: "لا تقدم فينكا إل أوليفار خدمة الإقامة. إليكم بعض الخيارات الموصى بها في الجوار.", en: "Finca El Olivar does not offer lodging. Here are some recommended options nearby."},
        hotels: [
          {
            name: {ar: "بارادور دي روندا", en: "Parador de Ronda"},
            city: {ar: "روندا", en: "Ronda"},
            distanceNote: {ar: "على بعد 2 كم من المكان", en: "2 km de la finca"},
            phone: "+34 952 877 500",
            email: "ronda@parador.es",
            websiteUrl: "https://www.parador.es/es/paradores/parador-de-ronda",
          },
          {
            name: {ar: "فندق كاتالونيا روندا", en: "Hotel Catalonia Ronda"},
            city: {ar: "روندا", en: "Ronda"},
            distanceNote: {ar: "1.5 كم", en: "1.5 km"},
            phone: "+34 952 872 315",
            email: "ronda@hoteles-catalonia.es",
            websiteUrl: "https://www.cataloniahotels.com/es/hotel/catalonia-ronda",
            promoCode: "BODA2026",
          },
          {
            name: {ar: "فندق مونتيليريو", en: "Hotel Montelirio"},
            city: {ar: "روندا", en: "Ronda"},
            distanceNote: {ar: "بوتيك | يطل على التاجو", en: "Boutique | Sobre el Tajo"},
            phone: "+34 952 873 855",
            email: "reservas@hotelmontelirio.com",
            websiteUrl: "https://www.hotelmontelirio.com",
          },
        ],
        closingNote: {
          ar: "بالنسبة للفنادق التي لا توجد معها اتفاقيات مباشرة، يرجى ذكر 'زفاف في فينكا إل أوليفار' للحصول على أسعار تفضيلية.",
          en: "For hotels without direct agreements, please mention 'Wedding at Finca El Olivar' to access preferential rates."
        },
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/locket-illustration.png",
      },
    },
    {
      type: "gifts",
      props: {
        title: {ar: "الهدايا", en: "Gifts"},
        body: {
          ar: "حضوركم هو أعظم هدية لنا. إذا كنتم ترغبون في تقديم هدية لنا، تجدون معلومات حسابنا البنكي أدناه:",
          en: "Your presence is our greatest gift. If you wish to give us something, please find our bank account information below:"
        },
        bgUrl: "/assets/drafts/elegante/gallery-8.jpg",
        bankAccounts: [
          {
            bankLabel: "CaixaBank",
            accountName: "Andrea Morales",
            iban: "ES00 0000 0000 0000 0000 0000",
            bic: "XXXXXXXXXXX",
          },
          {
            bankLabel: "Banco Santander",
            accountName: "Pedro Fernández",
            iban: "ES00 0000 0000 0000 0000 0000",
            bic: "XXXXXXXXXXX",
          },
        ],
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/wedding-rings.png",
      },
    },
    {
      type: "rsvp",
      props: {
        title: {ar: "تأكيد الحضور", en: "RSVP"},
        subtitle: {ar: "أخبرونا إن كنتم ستتمكنون من الحضور", en: "Let us know if you can make it"},
        attendanceOptions: {
          yes: {ar: "نعم، سأحضر", en: "Yes, I'll be there"},
          no: {ar: "للأسف لن أتمكن من الحضور", en: "Unfortunately, I can't make it"},
        },
        guestCountMode: "stepper",
        nameFieldLabel: {ar: "الشخص 1 (جهة الاتصال الرئيسية)", en: "Person 1 (Main contact)"},
        showDietaryField: true,
        dietaryFieldLabel: {ar: "المتطلبات الغذائية", en: "Dietary requirements"},
        dietaryPlaceholder: {ar: "مثال: نباتي، حساسية، إلخ.", en: "e.g. vegetarian, allergies, etc."},
        childrenMode: "radios",
        childrenLabel: {ar: "هل سيحضر أي أطفال؟", en: "Will any children be attending?"},
        submitLabel: {ar: "إرسال تأكيد الحضور", en: "Send RSVP"},
      },
    },
    {
      type: "imageDivider",
      props: {
        imageUrl: "/assets/drafts/elegante/swans-framed.png",
      },
    },
    {
      type: "credit",
      props: {
        name: {ar: "وليد أشرف", en: "Waleed Ashraf"},
        portfolioUrl: "https://waleed-ashraf.vercel.app/",
        portfolioLabel: {ar: "معرض الأعمال", en: "Portfolio"},
        coupleNames: {ar: "أندريا وبيدرو", en: "Andrea & Pedro"},
        eventDate: {ar: "12 سبتمبر 2026", en: "12 September 2026"},
      },
    },
  ],
};

const result = parseInvitationData(rawData);
if (!result.ok) {
  throw new Error(`Elegante data validation failed: ${JSON.stringify(result.errors, null, 2)}`);
}
export const getEleganteData = () => result.data;
