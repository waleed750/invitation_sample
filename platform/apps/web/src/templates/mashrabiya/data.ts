import {parseInvitationData, type InvitationData} from '@platform/shared';

const khatamRuleUrl = '/assets/demo/mashrabiya/khatam-rule.svg';
const footerOrnamentUrl = '/assets/demo/mashrabiya/ornament.svg';

export const mashrabiyaData: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'interactive-reveal',
    introType: 'tap-to-open',
    layoutFamily: 'mashrabiya',
  },
  theme: {
    background: '#14183A',
    foreground: '#F5EEE1',
    muted: '#B9BEDA',
    ivory: '#F5EEE1',
  },
  couple: {
    firstName: {ar: 'يوسف', en: 'Youssef'},
    secondName: {ar: 'ليلى', en: 'Laila'},
    headline: {
      ar: 'بكل حب ندعوكم لحضور حفل زفافنا',
      en: 'Together with our families, we invite you to our wedding',
    },
  },
  event: {
    date: '2027-04-15T19:30:00+02:00',
    displayDate: {
      ar: 'الخميس 15 أبريل 2027',
      en: 'Thursday, 15 April 2027',
    },
    startTime: {ar: '7:30 مساءً', en: '7:30 PM'},
    endTime: {ar: '1:00 صباحًا', en: '1:00 AM'},
    venue: {
      ar: 'حديقة الياسمين — الزمالك، القاهرة',
      en: 'Jasmine Garden — Zamalek, Cairo',
    },
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Zamalek%2C+Cairo',
    location: {ar: 'الزمالك، القاهرة', en: 'Zamalek, Cairo'},
  },
  media: {
    footerOrnamentUrl,
    ornamentUrl: footerOrnamentUrl,
  },
  copy: {
    tapLabel: {ar: 'اضغط لفتح الشبابيك', en: 'Tap to open the shutters'},
    welcomeTitle: {ar: 'أهلاً بكم في ليلتنا', en: 'Welcome to Our Evening'},
    welcome: {
      ar: 'يسعدنا ويشرفنا أن تشاركونا فرحة العمر واجتماع العائلتين تحت سماء القاهرة الساحرة.',
      en: 'Together with our families, we warmly invite you to celebrate under the Cairo night sky.',
    },
    scheduleTitle: {ar: 'برنامج الحفل', en: 'Order of Events'},
    scheduleSubtitle: {ar: 'محطات أمسيتنا المميزة', en: 'Order of the evening'},
    detailsTitle: {ar: 'تفاصيل الحفل', en: 'The Details'},
    detailsSubtitle: {ar: 'المكان والموعد', en: 'Time & Venue'},
    messageTitle: {ar: 'دفتر التهاني', en: 'Guestbook'},
    messageSubtitle: {ar: 'شاركونا أمنياتكم الطيبة', en: 'Leave a note of love and congratulations'},
  },
  schedule: [
    {
      title: {ar: 'استقبال الضيوف', en: 'Welcome drinks'},
      time: {ar: '7:30 مساءً', en: '7:30 PM'},
    },
    {
      title: {ar: 'الزفة', en: 'Zaffa'},
      time: {ar: '8:30 مساءً', en: '8:30 PM'},
    },
    {
      title: {ar: 'العشاء', en: 'Dinner'},
      time: {ar: '9:30 مساءً', en: '9:30 PM'},
    },
    {
      title: {ar: 'الرقص تحت القمر', en: 'Dancing under the moon'},
      time: {ar: '11:00 مساءً', en: '11:00 PM'},
    },
  ],
  sections: [
    {
      type: 'hero',
      props: {
        headline: {
          ar: 'بكل حب ندعوكم لحضور حفل زفافنا',
          en: 'Together with our families, we invite you to our wedding',
        },
        firstName: {ar: 'يوسف', en: 'Youssef'},
        secondName: {ar: 'ليلى', en: 'Laila'},
        displayDate: {
          ar: 'الخميس 15 أبريل 2027',
          en: 'Thursday, 15 April 2027',
        },
        scrollCueLabel: {ar: 'تابع القراءة', en: 'Scroll down'},
      },
    },
    {
      type: 'imageDivider',
      props: {
        imageUrl: khatamRuleUrl,
        alt: {ar: 'زخرفة النجمة الثمانية', en: 'Eight-point star motif'},
        line: true,
      },
    },
    {
      type: 'welcome',
      props: {
        kicker: {ar: 'مرحباً بكم', en: 'Welcome'},
        title: {ar: 'أهلاً وسهلاً بكم', en: 'Welcome to Our Celebration'},
        body: {
          ar: 'يسعدنا ويشرفنا أن تشاركونا فرحة العمر واجتماع العائلتين تحت سماء القاهرة الساحرة في ليلة تملؤها المحبة والموسيقى والذكريات الجميلة.',
          en: 'We are thrilled to welcome our family and cherished friends as we unite under the Cairo night sky for an evening of warmth, music, and celebration.',
        },
      },
    },
    {
      type: 'countdown',
      props: {
        date: '2027-04-15T19:30:00+02:00',
        kicker: {ar: 'العد التنازلي', en: 'Countdown'},
        title: {ar: 'في انتظار موعدنا', en: 'Counting the Days'},
        untilLabel: {ar: 'حتى نجتمع معاً', en: 'Until we celebrate together'},
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
            quote: {ar: 'لقاء على ضفاف النيل', en: 'A Meeting by the Nile'},
            prose: {
              ar: 'بدأت حكايتنا في مقهى قديم في حي الزمالك، حيث جمعنا حديث دافئ عن الفن المعماري وتاريخ القاهرة، ولم ينتهِ الحديث منذ ذلك اليوم.',
              en: 'Our story began in a quiet café in Zamalek, over a shared love for Cairo architecture and warm conversations that never truly ended.',
            },
          },
          {
            quote: {ar: 'الوعد تحت القمر', en: 'A Promise Under the Stars'},
            prose: {
              ar: 'على شرفة تطل على النيل الهادئ، قررنا أن نبني بيتاً من مودة وسكينة، وأن نشارك أحبتنا بداية هذه الرحلة الجميلة.',
              en: 'On a rooftop terrace overlooking the Nile, we made the promise to build a life together with love, joy, and peace.',
            },
          },
        ],
      },
    },
    {
      type: 'schedule',
      props: {
        title: {ar: 'برنامج الحفل', en: 'Order of Events'},
        subtitle: {ar: 'محطات أمسيتنا المميزة', en: 'Order of the evening'},
        items: [
          {
            title: {ar: 'استقبال الضيوف', en: 'Welcome drinks'},
            time: {ar: '7:30 م', en: '7:30 PM'},
          },
          {
            title: {ar: 'الزفة', en: 'Zaffa'},
            time: {ar: '8:30 م', en: '8:30 PM'},
          },
          {
            title: {ar: 'العشاء', en: 'Dinner'},
            time: {ar: '9:30 م', en: '9:30 PM'},
          },
          {
            title: {ar: 'الرقص تحت القمر', en: 'Dancing under the moon'},
            time: {ar: '11:00 م', en: '11:00 PM'},
          },
        ],
        stops: [
          {time: {ar: '7:30 م', en: '7:30 PM'}, text: {ar: 'استقبال الضيوف', en: 'Welcome drinks'}},
          {time: {ar: '8:30 م', en: '8:30 PM'}, text: {ar: 'الزفة', en: 'Zaffa'}},
          {time: {ar: '9:30 م', en: '9:30 PM'}, text: {ar: 'العشاء', en: 'Dinner'}},
          {time: {ar: '11:00 م', en: '11:00 PM'}, text: {ar: 'الرقص تحت القمر', en: 'Dancing under the moon'}},
        ],
      },
    },
    {
      type: 'details',
      props: {
        title: {ar: 'المكان والموعد', en: 'Location & Time'},
        subtitle: {ar: 'يسرنا حضوركم', en: 'We look forward to seeing you'},
        venue: {
          ar: 'حديقة الياسمين — الزمالك، القاهرة',
          en: 'Jasmine Garden — Zamalek, Cairo',
        },
        startTime: {ar: '7:30 مساءً', en: '7:30 PM'},
        endTime: {ar: '1:00 صباحًا', en: '1:00 AM'},
        dateLine: {
          ar: 'الخميس 15 أبريل 2027',
          en: 'Thursday, 15 April 2027',
        },
        addressLines: [
          {ar: 'شارع الجزيرة، حي الزمالك', en: 'Gezira Street, Zamalek'},
          {ar: 'القاهرة، جمهورية مصر العربية', en: 'Cairo, Egypt'},
        ],
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Zamalek%2C+Cairo',
        mapLabel: {ar: 'عرض الموقع على الخريطة', en: 'Open in Google Maps'},
        locationLabel: {ar: 'موقع الحفل', en: 'Venue'},
      },
    },
    {
      type: 'dressCode',
      props: {
        title: {ar: 'الزي المفضل', en: 'Dress Code'},
        body: {
          ar: 'الملابس الرسمية الأنيقة (Black Tie Optional). نتطلع لرؤيتكم بأبهى حلة لتكتمل بهجة الليلة.',
          en: 'Black Tie Optional / Formal Evening Attire. We look forward to celebrating in style together.',
        },
      },
    },
    {
      type: 'faq',
      props: {
        title: {ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions'},
        items: [
          {
            question: {ar: 'هل تتوفر أماكن لصف السيارات؟', en: 'Is parking available?'},
            answer: {
              ar: 'نعم، تتوفر خدمة صف السيارات (Valet) عند مدخل الحديقة لجميع ضيوفنا الكرام.',
              en: 'Yes, complimentary valet parking is available at the entrance of the garden for all guests.',
            },
          },
          {
            question: {ar: 'هل الحفل في مكان داخلي أم خارجي؟', en: 'Is the event indoors or outdoors?'},
            answer: {
              ar: 'يقام الحفل في حديقة مكشوفة مطلة على النيل تحت سماء القاهرة، مع توفر مساحات مغطاة مريحة.',
              en: 'The celebration takes place in an open-air garden overlooking the Nile, with comfortable covered lounge areas.',
            },
          },
          {
            question: {ar: 'هل يمكن اصطحاب الأطفال؟', en: 'Are children invited?'},
            answer: {
              ar: 'نرجو تفهمكم بأن الحفل مخصص للكبار فقط لنضمن قضاء ليلة ممتعة وهادئة للجميع.',
              en: 'While we love your little ones, our evening is planned as an adults-only celebration.',
            },
          },
        ],
      },
    },
    {
      type: 'rsvp',
      props: {
        title: {ar: 'تأكيد الحضور', en: 'RSVP'},
        subtitle: {
          ar: 'يسعدنا تأكيد حضوركم قبل الأول من أبريل',
          en: 'Please let us know if you can attend by April 1st',
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
          en: 'Leave a warm note for Youssef & Laila',
        },
        nameFieldLabel: {ar: 'الاسم', en: 'Your Name'},
        namePlaceholder: {ar: 'أدخل اسمك', en: 'Enter your name'},
        messageLabel: {ar: 'رسالتك للعروسين', en: 'Your Message'},
        messagePlaceholder: {
          ar: 'اكتب أمنياتك وتهانيك للعروسين هنا...',
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

export function getMashrabiyaData(): InvitationData {
  const result = parseInvitationData(mashrabiyaData);
  if (!result.ok) {
    throw new Error(`Invalid mashrabiya demo: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}
