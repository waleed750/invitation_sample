import {parseInvitationData, type InvitationData} from '@platform/shared';

const starDividerUrl = '/assets/demo/diwan/divider-star.svg';
const eventCeremonyUrl = '/assets/demo/diwan/event-ceremony.svg';
const eventReceptionUrl = '/assets/demo/diwan/event-reception.svg';
const footerOrnamentUrl = '/assets/demo/diwan/footer-ornament.svg';

export const diwanData: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'interactive-reveal',
    introType: 'envelope',
    layoutFamily: 'classic',
  },
  theme: {
    background: '#fcf9f5',
    foreground: '#1f3d33',
    muted: '#5a625d',
    ivory: '#fcf9f5',
  },
  couple: {
    firstName: {ar: 'عمر', en: 'Omar'},
    secondName: {ar: 'ياسمين', en: 'Yasmine'},
    headline: {
      ar: 'نحتفل بزفافنا',
      en: 'We are getting married',
    },
  },
  event: {
    date: '2027-05-20T19:00:00+03:00',
    displayDate: {
      ar: 'الخميس 20 مايو 2027',
      en: 'Thursday, 20 May 2027',
    },
    venue: {
      ar: 'قاعة الواحة · التجمع الخامس، القاهرة',
      en: 'Al Waha Hall · Fifth Settlement, Cairo',
    },
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Fifth+Settlement%2C+Cairo',
  },
  media: {
    footerOrnamentUrl,
    ornamentUrl: footerOrnamentUrl,
  },
  copy: {
    tapLabel: {ar: 'اضغط لفتح الدعوة', en: 'Tap to open'},
    welcomeTitle: {ar: 'دعوة زفاف', en: 'Wedding Invitation'},
    welcome: {
      ar: 'بكل الحب والسرور، ندعوكم لمشاركتنا فرحة عمرنا والاحتفال بزفافنا.',
      en: 'With great joy and love, we invite you to share our happiness and celebrate our wedding.',
    },
    scheduleTitle: {ar: 'برنامج الحفل', en: 'Order of Events'},
    scheduleSubtitle: {ar: 'محطات أمسيتنا', en: 'Our evening'},
    detailsTitle: {ar: 'تفاصيل الحفل', en: 'The Details'},
    detailsSubtitle: {ar: 'المكان والزمان', en: 'Time & Venue'},
    messageTitle: {ar: 'دفتر التهاني', en: 'Guestbook'},
    messageSubtitle: {ar: 'شاركونا أمنياتكم الطيبة', en: 'Leave a note of love and congratulations'},
  },
  schedule: [],
  sections: [
    {
      type: 'hero',
      props: {
        headline: {
          ar: 'نحتفل بزفافنا',
          en: 'We are getting married',
        },
        firstName: {ar: 'عمر', en: 'Omar'},
        secondName: {ar: 'ياسمين', en: 'Yasmine'},
        displayDate: {
          ar: 'الخميس 20 مايو 2027',
          en: 'Thursday, 20 May 2027',
        },
      },
    },
    {
      type: 'imageDivider',
      props: {
        imageUrl: starDividerUrl,
        alt: {ar: 'فاصل', en: 'Divider'},
        line: true,
      },
    },
    {
      type: 'welcome',
      props: {
        title: {ar: 'دعوة زفاف', en: 'Wedding Invitation'},
        body: {
          ar: 'بكل الحب والسرور، ندعوكم لمشاركتنا فرحة عمرنا والاحتفال بزفافنا.',
          en: 'With great joy and love, we invite you to share our happiness and celebrate our wedding.',
        },
        cards: [
          {
            kicker: {ar: 'كتب الكتاب', en: 'Ceremony'},
            time: {ar: '6:00 مساءً', en: '6:00 PM'},
            imageUrl: eventCeremonyUrl,
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Fifth+Settlement%2C+Cairo',
          },
          {
            kicker: {ar: 'الحفل', en: 'Reception'},
            time: {ar: '8:00 مساءً', en: '8:00 PM'},
            imageUrl: eventReceptionUrl,
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Fifth+Settlement%2C+Cairo',
          },
        ],
      },
    },
    {
      type: 'countdown',
      props: {
        date: '2027-05-20T19:00:00+03:00',
        title: {ar: 'في انتظار موعدنا', en: 'Counting the Days'},
        showSeconds: false,
        labels: {
          days: {ar: 'يوم', en: 'Days'},
          hours: {ar: 'ساعة', en: 'Hours'},
          minutes: {ar: 'دقيقة', en: 'Minutes'},
        },
      },
    },
    {
      type: 'story',
      props: {
        title: {ar: 'قصتنا', en: 'Our Story'},
        chapters: [
          {
            prose: {
              ar: 'بدأت قصتنا بلقاء بسيط، تحول سريعاً إلى رحلة من الصداقة والحب والاحترام المتبادل.',
              en: 'Our story began with a simple meeting that quickly blossomed into a journey of friendship, love, and mutual respect.',
            },
          },
          {
            prose: {
              ar: 'واليوم نخطو معاً نحو مستقبل مشرق، واعدين بعضنا بالبقاء معاً في كل لحظات الحياة.',
              en: 'Today we step together towards a bright future, promising to stand by each other in every moment of life.',
            },
          },
        ],
      },
    },
    {
      type: 'schedule',
      props: {
        title: {ar: 'برنامج الحفل', en: 'Order of Events'},
        subtitle: {ar: 'محطات أمسيتنا', en: 'Our evening'},
        items: [
          {
            title: {ar: 'استقبال الضيوف', en: 'Reception'},
            time: {ar: '7:00 م', en: '7:00 PM'},
          },
          {
            title: {ar: 'الدخول', en: 'Entrance'},
            time: {ar: '8:00 م', en: '8:00 PM'},
          },
          {
            title: {ar: 'العشاء', en: 'Dinner'},
            time: {ar: '9:00 م', en: '9:00 PM'},
          },
          {
            title: {ar: 'الرقصة الأولى', en: 'First Dance'},
            time: {ar: '10:30 م', en: '10:30 PM'},
          },
          {
            title: {ar: 'الختام', en: 'Farewell'},
            time: {ar: '12:00 ص', en: '12:00 AM'},
          },
        ],
        stops: [
          {time: {ar: '7:00 م', en: '7:00 PM'}, text: {ar: 'استقبال الضيوف', en: 'Reception'}},
          {time: {ar: '8:00 م', en: '8:00 PM'}, text: {ar: 'الدخول', en: 'Entrance'}},
          {time: {ar: '9:00 م', en: '9:00 PM'}, text: {ar: 'العشاء', en: 'Dinner'}},
          {time: {ar: '10:30 م', en: '10:30 PM'}, text: {ar: 'الرقصة الأولى', en: 'First Dance'}},
          {time: {ar: '12:00 ص', en: '12:00 AM'}, text: {ar: 'الختام', en: 'Farewell'}},
        ],
      },
    },
    {
      type: 'dressCode',
      props: {
        title: {ar: 'قواعد الملابس', en: 'Dress Code'},
        body: {
          ar: 'نرجو من ضيوفنا الكرام الالتزام بالملابس الرسمية.',
          en: 'We kindly request our guests to dress in formal attire.',
        },
        groups: [
          {
            heading: {ar: 'السيدات', en: 'Ladies'},
            body: {ar: 'فساتين سهرة طويلة', en: 'Long evening gowns'},
          },
          {
            heading: {ar: 'الرجال', en: 'Gentlemen'},
            body: {ar: 'بدل رسمية أو توكسيدو', en: 'Formal suits or tuxedos'},
          },
        ],
      },
    },
    {
      type: 'details',
      props: {
        title: {ar: 'المكان والموعد', en: 'Location & Time'},
        subtitle: {ar: 'تفاصيل الحفل', en: 'Event Details'},
        venue: {
          ar: 'قاعة الواحة · التجمع الخامس، القاهرة',
          en: 'Al Waha Hall · Fifth Settlement, Cairo',
        },
        startTime: {ar: '7:00 مساءً', en: '7:00 PM'},
        endTime: {ar: '12:00 صباحًا', en: '12:00 AM'},
        addressLines: [
          {ar: 'قاعة الواحة', en: 'Al Waha Hall'},
          {ar: 'التجمع الخامس، القاهرة', en: 'Fifth Settlement, Cairo'},
        ],
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Fifth+Settlement%2C+Cairo',
        mapLabel: {ar: 'عرض الموقع على الخريطة', en: 'Open in Google Maps'},
      },
    },
    {
      type: 'faq',
      props: {
        title: {ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions'},
        items: [
          {
            question: {ar: 'هل يتوفر موقف للسيارات؟', en: 'Is parking available?'},
            answer: {ar: 'نعم، يتوفر موقف للسيارات مجاناً للضيوف.', en: 'Yes, complimentary parking is available for guests.'},
          },
          {
            question: {ar: 'هل يمكن اصطحاب الأطفال؟', en: 'Are children invited?'},
            answer: {ar: 'نعتذر، الحفل مخصص للبالغين فقط.', en: 'We apologize, but the event is adults only.'},
          },
          {
            question: {ar: 'ما هي تفاصيل الهدايا؟', en: 'What about gifts?'},
            answer: {ar: 'حضوركم هو أجمل هدية لنا.', en: 'Your presence is the greatest gift of all.'},
          },
        ],
      },
    },
    {
      type: 'rsvp',
      props: {
        title: {ar: 'تأكيد الحضور', en: 'RSVP'},
        subtitle: {
          ar: 'نرجو تأكيد الحضور في أقرب وقت',
          en: 'Please confirm your attendance',
        },
        guestCountMode: 'stepper',
        attendingLabel: {ar: 'هل ستشاركونا الحفل؟', en: 'Will you be joining us?'},
        attendanceOptions: {
          yes: {ar: 'بكل سرور، سأحضر', en: 'Joyfully accepts'},
          no: {ar: 'للأسف، لا أستطيع الحضور', en: 'Regretfully declines'},
        },
        nameFieldLabel: {ar: 'الاسم الكريم', en: 'Full Name'},
        namePlaceholder: {ar: 'أدخل اسمك الكريم', en: 'Enter your full name'},
        guestCountLabel: {ar: 'عدد الضيوف', en: 'Number of Guests'},
        emailLabel: {ar: 'البريد الإلكتروني', en: 'Email Address'},
        emailPlaceholder: {ar: 'name@example.com', en: 'name@example.com'},
        submitLabel: {ar: 'إرسال التأكيد', en: 'Submit RSVP'},
        successMessage: {
          ar: 'شكرًا لتأكيد حضوركم! نتطلع لرؤيتكم.',
          en: 'Thank you for responding! We look forward to seeing you.',
        },
      },
    },
    {
      type: 'messageForm',
      props: {
        title: {ar: 'دفتر التهاني', en: 'Guestbook'},
        subtitle: {
          ar: 'كلماتكم الطيبة تسعد قلوبنا',
          en: 'Leave a warm note for us',
        },
        nameFieldLabel: {ar: 'الاسم', en: 'Your Name'},
        namePlaceholder: {ar: 'أدخل اسمك', en: 'Enter your name'},
        messageLabel: {ar: 'رسالتك', en: 'Your Message'},
        messagePlaceholder: {
          ar: 'اكتب أمنياتك وتهانيك هنا...',
          en: 'Share your warm wishes...',
        },
        submitLabel: {ar: 'إرسال التهنئة', en: 'Send Wishes'},
        successMessage: {
          ar: 'وصلت تهنئتكم ودفأت قلوبنا! شكرًا لكم.',
          en: 'Thank you for your beautiful message!',
        },
      },
    },
    {
      type: 'footer',
      props: {
        ornamentUrl: footerOrnamentUrl,
      },
    },
  ],
};

export function getDiwanData(): InvitationData {
  const result = parseInvitationData(diwanData);
  if (!result.ok) {
    throw new Error(`Invalid diwan demo: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}
