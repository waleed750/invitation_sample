import {parseInvitationData, type InvitationData} from '@platform/shared';

// Scene art: original images generated for Invitely (see ASSET_LICENSES.md).
const art = (name: string) => `/assets/demo/bustan/${name}`;
const mapUrl = 'https://www.google.com/maps/search/?api=1&query=Sheikh+Zayed+City%2C+Giza';
const date = '2027-09-24T19:00:00+03:00';

const firstName = {ar: 'آدم', en: 'Adam'};
const secondName = {ar: 'سلمى', en: 'Salma'};
const headline = {ar: 'بقلوبٍ عامرة بالفرح ندعوكم لحفل زفافنا', en: 'With joyful hearts, we invite you to our wedding'};
const displayDate = {ar: 'الجمعة · 24 سبتمبر 2027', en: 'Friday · 24 September 2027'};
const venue = {ar: 'بستان الورد · الشيخ زايد، الجيزة', en: 'Rose Orchard · Sheikh Zayed, Giza'};

export const bustanData: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'interactive-reveal',
    introType: 'tap-to-open',
    layoutFamily: 'classic',
  },
  theme: {background: '#f8f5ee', foreground: '#1f2a24', muted: '#4f6457', ivory: '#f8f5ee'},
  couple: {firstName, secondName, headline},
  event: {date, displayDate, venue, mapUrl},
  media: {footerOrnamentUrl: art('seal.jpg')},
  copy: {
    tapLabel: {ar: 'المس القفل لفتح البوابة', en: 'Touch the seal to open the gate'},
    welcomeTitle: {ar: 'أهلاً بكم في بستاننا', en: 'Welcome to our garden'},
    welcome: {
      ar: 'بين الورد وأضواء المساء، يسعدنا أن تشاركونا أجمل أيام العمر.',
      en: 'Among roses and the glow of evening lights, we would love you beside us on the happiest day of our lives.',
    },
  },
  sections: [
    {type: 'hero', props: {headline, firstName, secondName, displayDate}},
    {
      type: 'welcome',
      props: {
        sectionId: 'verse',
        kicker: {ar: 'بسم الله', en: 'With blessings'},
        title: {
          ar: '﴿وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً﴾',
          en: 'And among His signs is that He created for you partners from yourselves, that you may find tranquility in them, and placed between you affection and mercy.',
        },
        body: {ar: 'صدق الله العظيم · سورة الروم', en: 'Quran 30:21'},
      },
    },
    {
      type: 'countdown',
      props: {
        date,
        kicker: {ar: 'نقترب من الموعد', en: 'The day is near'},
        title: {ar: 'العدّ التنازلي', en: 'The Countdown'},
        showSeconds: false,
        columnLeftUrl: art('urn.jpg'),
        columnRightUrl: art('urn.jpg'),
        labels: {days: {ar: 'يوم', en: 'Days'}, hours: {ar: 'ساعة', en: 'Hours'}, minutes: {ar: 'دقيقة', en: 'Minutes'}},
      },
    },
    {
      type: 'welcome',
      props: {
        kicker: {ar: 'أمسيتنا', en: 'Our evening'},
        title: {ar: 'أهلاً بكم في بستاننا', en: 'Welcome to our garden'},
        body: {
          ar: 'نبدأ بعقد القران في الفناء القديم، ثم ننتقل إلى حفل العشاء تحت الأضواء.',
          en: 'We begin with the ceremony in the old courtyard, then gather for dinner beneath the lights.',
        },
        cards: [
          {
            kicker: {ar: 'عقد القران', en: 'The ceremony'},
            heading: {ar: 'الفناء القديم', en: 'The Old Courtyard'},
            date: displayDate,
            time: {ar: '6:00 مساءً', en: '6:00 in the evening'},
            imageUrl: art('ceremony.jpg'),
            mapUrl,
            mapLabel: {ar: 'عرض الموقع', en: 'View on the map'},
          },
          {
            kicker: {ar: 'حفل العشاء', en: 'The reception'},
            heading: {ar: 'مائدة الحديقة', en: 'The Garden Table'},
            date: displayDate,
            time: {ar: '8:00 مساءً', en: '8:00 in the evening'},
            imageUrl: art('reception.jpg'),
            mapUrl,
            mapLabel: {ar: 'عرض الموقع', en: 'View on the map'},
          },
        ],
      },
    },
    {
      type: 'welcome',
      props: {
        sectionId: 'families',
        kicker: {ar: 'العائلتان الكريمتان', en: 'The two families'},
        title: {ar: 'يتشرف بدعوتكم', en: 'Request the honour of your presence'},
        body: {ar: 'لتشاركونا فرحة زفاف أبنائهم.', en: 'at the wedding of their children.'},
        cards: [
          {kicker: {ar: 'أسرة العريس', en: 'The groom’s family'}, heading: {ar: 'عائلة المنصوري', en: 'The Mansouri family'}},
          {kicker: {ar: 'أسرة العروس', en: 'The bride’s family'}, heading: {ar: 'عائلة الراشدي', en: 'The Rashidi family'}},
        ],
      },
    },
    {
      type: 'gallery',
      props: {
        title: {ar: 'بعض ذكرياتنا', en: 'A few memories'},
        images: [
          {src: art('memory1.jpg'), alt: {ar: 'عروسان يسيران بين الورد', en: 'The couple walking among the roses'}},
          {src: art('memory2.jpg'), alt: {ar: 'عروسان على مقعد الحديقة عند الغروب', en: 'The couple on a garden bench at dusk'}},
        ],
      },
    },
    {
      type: 'story',
      props: {
        title: {ar: 'حكايتنا', en: 'Our Story'},
        chapters: [
          {
            quote: {ar: 'لقاء بين الورد', en: 'A meeting among the roses'},
            prose: {
              ar: 'التقينا أول مرة في معرض للزهور بوسط القاهرة، وتحدثنا طويلاً عن الحدائق التي نحلم بها.',
              en: 'We first met at a flower fair in central Cairo and talked for hours about the gardens we dreamed of.',
            },
          },
          {
            quote: {ar: 'وعدٌ في المساء', en: 'A promise at dusk'},
            prose: {
              ar: 'في مساء هادئ تحت الأضواء الدافئة، وعدنا بعضنا ببيتٍ يشبه هذا البستان: مليء بالمودة والهدوء.',
              en: 'On a quiet evening under warm lights, we promised each other a home like this garden: full of kindness and calm.',
            },
          },
        ],
      },
    },
    {
      type: 'schedule',
      props: {
        title: {ar: 'برنامج الأمسية', en: 'The Evening'},
        subtitle: {ar: 'من الغروب حتى آخر الليل', en: 'From golden hour to the last dance'},
        items: [
          {title: {ar: 'استقبال الضيوف', en: 'Guests arrive'}, time: {ar: '5:30 م', en: '5:30 PM'}},
          {title: {ar: 'عقد القران', en: 'The ceremony'}, time: {ar: '6:00 م', en: '6:00 PM'}},
          {title: {ar: 'العشاء', en: 'Dinner'}, time: {ar: '8:00 م', en: '8:00 PM'}},
          {title: {ar: 'الرقصة الأولى', en: 'First dance'}, time: {ar: '10:00 م', en: '10:00 PM'}},
        ],
        stops: [
          {time: {ar: '5:30 م', en: '5:30 PM'}, text: {ar: 'استقبال الضيوف', en: 'Guests arrive'}},
          {time: {ar: '6:00 م', en: '6:00 PM'}, text: {ar: 'عقد القران', en: 'The ceremony'}},
          {time: {ar: '8:00 م', en: '8:00 PM'}, text: {ar: 'العشاء', en: 'Dinner'}},
          {time: {ar: '10:00 م', en: '10:00 PM'}, text: {ar: 'الرقصة الأولى', en: 'First dance'}},
        ],
      },
    },
    {
      type: 'dressCode',
      props: {
        title: {ar: 'الزي المقترح', en: 'Dress Code'},
        body: {
          ar: 'أناقة الحدائق: ألوان هادئة كالمريمية والعاجي والوردي الفاتح. ننصح بأحذية مريحة للمشي على الحصى.',
          en: 'Garden elegance: soft sage, ivory and blush tones. We suggest comfortable shoes for the gravel paths.',
        },
        groups: [
          {heading: {ar: 'للسيدات', en: 'For ladies'}, body: {ar: 'فساتين طويلة أو أنيقة بألوان فاتحة.', en: 'Long or tea-length dresses in light tones.'}},
          {heading: {ar: 'للسادة', en: 'For gentlemen'}, body: {ar: 'بدلة رسمية بألوان هادئة، ويمكن الاستغناء عن ربطة العنق.', en: 'A suit in calm tones; a tie is optional.'}},
        ],
      },
    },
    {
      type: 'details',
      props: {
        title: {ar: 'المكان', en: 'The Venue'},
        subtitle: {ar: 'حيث نلتقي', en: 'Where we gather'},
        venue,
        startTime: {ar: '5:30 م', en: '5:30 PM'},
        endTime: {ar: '12:00 ص', en: '12:00 AM'},
        addressLines: [
          {ar: 'بستان الورد', en: 'Rose Orchard'},
          {ar: 'الشيخ زايد، الجيزة', en: 'Sheikh Zayed, Giza'},
        ],
        mapUrl,
        mapLabel: {ar: 'افتح في خرائط جوجل', en: 'Open in Google Maps'},
      },
    },
    {
      type: 'faq',
      props: {
        title: {ar: 'أسئلة قد تخطر لكم', en: 'Good to know'},
        items: [
          {
            question: {ar: 'هل تتوفر مواقف للسيارات؟', en: 'Is parking available?'},
            answer: {ar: 'نعم، يوجد موقف مجاني عند المدخل الرئيسي للبستان مع خدمة ركن السيارات.', en: 'Yes, there is free parking at the main entrance, with a valet service.'},
          },
          {
            question: {ar: 'هل الحفل في الهواء الطلق؟', en: 'Is it outdoors?'},
            answer: {ar: 'نعم، في الحديقة تحت الأضواء، مع مساحات مغطاة إذا تغيّر الجو.', en: 'Yes, in the garden beneath the lights, with covered areas in case the weather changes.'},
          },
          {
            question: {ar: 'هل يمكن اصطحاب الأطفال؟', en: 'Are children welcome?'},
            answer: {ar: 'الأطفال مرحّب بهم، وسنجهز لهم ركناً هادئاً للعب.', en: 'Children are welcome, and we will set up a quiet play corner for them.'},
          },
        ],
      },
    },
    {
      type: 'rsvp',
      props: {
        title: {ar: 'تأكيد الحضور', en: 'Kindly Reply'},
        subtitle: {ar: 'نرجو الرد قبل 1 سبتمبر 2027', en: 'We hope to hear from you by 1 September 2027'},
        guestCountMode: 'stepper',
        attendingLabel: {ar: 'هل ستشاركوننا الفرحة؟', en: 'Will you join us?'},
        attendanceOptions: {yes: {ar: 'بكل سرور، سأحضر', en: 'Joyfully accepts'}, no: {ar: 'أعتذر عن الحضور', en: 'Regretfully declines'}},
        nameFieldLabel: {ar: 'الاسم', en: 'Full name'},
        namePlaceholder: {ar: 'اكتب اسمك', en: 'Your name'},
        guestCountLabel: {ar: 'عدد الضيوف', en: 'Number of guests'},
        emailLabel: {ar: 'البريد الإلكتروني', en: 'Email'},
        emailPlaceholder: {ar: 'name@example.com', en: 'name@example.com'},
        submitLabel: {ar: 'إرسال الرد', en: 'Send reply'},
        successMessage: {ar: 'شكرًا لكم، وصلنا ردّكم.', en: 'Thank you, your reply has reached us.'},
      },
    },
    {
      type: 'messageForm',
      props: {
        title: {ar: 'دفتر التهاني', en: 'Guestbook'},
        subtitle: {ar: 'كلماتكم الطيبة تسعد قلوبنا', en: 'Leave a warm note for Adam & Salma'},
        nameFieldLabel: {ar: 'الاسم', en: 'Your Name'},
        namePlaceholder: {ar: 'أدخل اسمك', en: 'Enter your name'},
        messageLabel: {ar: 'رسالتك للعروسين', en: 'Your Message'},
        messagePlaceholder: {ar: 'اكتب أمنياتك وتهانيك هنا...', en: 'Share your warm wishes...'},
        submitLabel: {ar: 'إرسال التهنئة', en: 'Send Wishes'},
        successMessage: {ar: 'وصلت تهنئتكم، شكرًا لكم.', en: 'Thank you for your beautiful message.'},
      },
    },
    {type: 'footer', props: {ornamentUrl: art('seal.jpg')}},
  ],
};

export function getBustanData(): InvitationData {
  const result = parseInvitationData(bustanData);
  if (!result.ok) throw new Error(`Invalid bustan demo: ${JSON.stringify(result.errors)}`);
  return result.data;
}
