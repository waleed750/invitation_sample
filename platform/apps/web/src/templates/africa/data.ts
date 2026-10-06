import {type InvitationData, parseInvitationData} from '@platform/shared';

const rawData: InvitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "safari-editorial",
  },
  theme: {
    background: "#fdf8f5",
    foreground: "#2c2a29",
    muted: "#6e6a67",
    ivory: "#fefaf6",
  },
  media: {
    musicUrl: "/assets/drafts/africa/background-music.mp3",
    introVideoUrl: "/assets/drafts/africa/intro-video.mp4",
    introPosterUrl: "/assets/drafts/africa/intro-poster.jpg",
  },
  copy: {
    tapLabel: {ar: "اضغط للفتح", en: "Tap to open"},
  },
  couple: {
    firstName: {ar: "دانيال", en: "Daniel"},
    secondName: {ar: "أميليا", en: "Amelia"},
    headline: {ar: "نحتفل بزفافنا", en: "We're Getting Married"},
  },
  event: {
    date: "2026-06-20T15:30:00+02:00",
  },
  sections: [
    {
      type: "hero",
      props: {
        firstName: {ar: "دانيال", en: "Daniel"},
        secondName: {ar: "أميليا", en: "Amelia"},
        displayDate: {ar: "20 يونيو 2026", en: "20 June 2026"},
      },
    },
    {
      type: "welcome",
      props: {
        title: {ar: "مرحباً بكم في أفريقيا", en: "Welcome to Africa"},
        body: {
          ar: "لقد حلمنا بحياة لا يمكننا وصفها إلا بأنها مغامرة رائعة ومستمرة، وتلك المغامرة تبدأ هنا. يغمرنا الفرح للاحتفال بزفافنا محاطين بجمال هذا المكان الاستثنائي والأشخاص الذين نحبهم أكثر.",
          en: "We’ve dreamt of a life we can only describe as a great, ongoing adventure, and that adventure begins here. We are beyond joyful to be celebrating our wedding surrounded by the wild beauty of this place and the people we love most.",
        },
        bgUrl: "/assets/drafts/africa/welcome-bg.png",
      },
    },
    {
      type: "story",
      props: {
        title: {ar: "رحلة في الذاكرة", en: "A trip down memory lane"},
        birdsFrame1: "/assets/drafts/africa/birds-frame-1.png",
        birdsFrame2: "/assets/drafts/africa/birds-frame-2.png",
        chapters: [
          {
            quote: {ar: "هل ترغبين في الرقص؟", en: "Do you want to dance?"},
            prose: {
              ar: "بدأ الأمر، كما تبدأ معظم القصص الجيدة، بأغنية لم يعرف أي منهما اسمها. سألها أخيرًا السؤال الوحيد الذي يهم: \"هل ترغبين في الرقص؟\"",
              en: "It started, as most good stories do, with a song neither of them knew the name of.\nAmelia had wandered into a rooftop bar in the old city of Cartagena, looking for nothing in particular \u2014 maybe a breeze, maybe a mojito, definitely not love. Daniel was on the other side of the dance floor, pretending he wasn't watching her pretend she wasn't watching him.\nFour songs in, he finally crossed the room and asked the only question that mattered: \"Do you want to dance?\"\nShe said yes before her brain could veto her feet. They danced badly. They danced beautifully. They danced until the lanterns went out \u2014 and somewhere between the bougainvillea and the second chorus, Cartagena decided their fate for them.",
            },
            photos: [
              "/assets/drafts/africa/story-1.jpg",
              "/assets/drafts/africa/story-2.jpg",
              "/assets/drafts/africa/story-3.jpg",
            ],
          },
          {
            quote: {ar: "هل ترغبين في مقابلة عائلتي؟", en: "Do you want to meet my family?"},
            prose: {
              ar: "بعد ثلاثة أشهر، أعلن دانيال أنهما سيذهبان لتناول الغداء مع عائلته. وقال: \"مجرد غداء صغير. ربما اثنا عشر شخصًا. خمسة عشر على الأكثر.\"",
              en: "Three months in, Daniel announced they were going to lunch with his family. \"Just a small one,\" he said. \"Maybe twelve people. Fifteen, tops.\"\nThere were thirty-two.\nThere were aunts who hugged Amelia like they'd known her since birth, cousins who insisted she try every plate on the table, and an abuela who took one look at her and quietly said, \"Esta se queda\" \u2014 this one stays.\nBy dessert, Amelia had been adopted, renamed, and entered into a group chat she still doesn't fully understand. Daniel just smiled. He'd known how it would go from the moment he asked her to come.",
            },
            photos: [
              "/assets/drafts/africa/story-4.jpg",
              "/assets/drafts/africa/story-5.jpg",
              "/assets/drafts/africa/story-6.jpg",
            ],
          },
          {
            quote: {ar: "هل تقبلين الزواج بي؟", en: "Do you want to be my wife?"},
            prose: {
              ar: "بعد عام، اقترح دانيال المشي وقت الغروب. ركع على ركبة واحدة وطلب يدها. نسيت أميليا كل شيء، ووافقت على الفور.",
              en: "A year later, Daniel suggested a sunset walk along the old city walls. \"Just a walk,\" he said. Suspiciously casual. Suspiciously well-dressed.\nThe Caribbean was doing its showing-off thing \u2014 gold, pink, ridiculous. Somewhere between the cannons and the last bend before the sea, Daniel slowed down, took her hand, and dropped to one knee.\nAmelia, who had imagined this moment in roughly four hundred different ways, forgot every one of them.\nWhat she actually said is still a matter of debate. Daniel claims it was \"yes.\" Amelia claims it was \"obviously.\" The waves, the only other witnesses, have politely refused to comment.",
            },
            photos: [
              "/assets/drafts/africa/story-7.jpg",
              "/assets/drafts/africa/story-8.jpg",
              "/assets/drafts/africa/story-9.jpg",
            ],
          },
        ],
      },
    },
    {
      type: "dressCode",
      props: {
        title: {ar: "قواعد اللباس", en: "Dress Code"},
        body: {
          ar: "نود أن يشعر ضيوفنا بالراحة. فكروا في الفساتين الانسيابية والأقمشة الطبيعية الخفيفة للسيدات، والقمصان المريحة والسراويل للرجال. بالنسبة للألوان، استلهموا من غروب الشمس الأفريقي — البني الدافئ، الكريمي الرملي، الوردي الفاتح، والعنبر الذهبي.",
          en: "We'd love for our guests to feel comfortable and carefree in the summer warmth. Think flowing dresses and light natural fabrics for the ladies, and relaxed shirts and trousers for the gentlemen.\n\nAs for colors, let yourself be inspired by an African sunset \u2014 warm browns, sandy creams, dusty pinks, golden ambers, and rich terracottas. Colors that glow like the horizon at dusk, alive with the warmth of the land.",
        },
        illustrationUrl: "/assets/drafts/africa/dress-code-illustration.png",
      },
    },
    {
      type: "gifts",
      props: {
        title: {ar: "الهدايا والأمنيات", en: "Gifts & Wishes"},
        body: {
          ar: "حضوركم زفافنا هو أعظم هدية. إذا كنتم ترغبون في تقديم هدية، نرحب بمساهماتكم، وأي كلمة طيبة ستكون غالية على قلوبنا.",
          en: "Your presence at our wedding is the greatest gift of all.\nShould you wish to give a little something, contributions to our newlywed fund are warmly welcomed.\nOtherwise, any heartfelt gift, a kind word, or a sincere prayer would be treasured just as much.",
        },
        bgUrl: "/assets/drafts/africa/gifts-bg.png",
      },
    },
    {
      type: "schedule",
      props: {
        title: {ar: "الجدول الزمني", en: "Schedule"},
        subtitle: {ar: "", en: ""},
        items: [
          {title: {ar: "الترحيب والمشروبات", en: "Welcoming with drinks"}, time: {ar: "3:30م", en: "3:30pm"}},
          {title: {ar: "مراسم الزفاف", en: "Ceremony"}, time: {ar: "4:00م", en: "4:00pm"}},
          {title: {ar: "المقبلات", en: "Cocktails & Canapé"}, time: {ar: "4:30م", en: "4:30pm"}},
          {title: {ar: "حفل الاستقبال", en: "Reception"}, time: {ar: "5:30م", en: "5:30pm"}},
        ],
        bgUrl: "/assets/drafts/africa/schedule-bg.png",
      },
    },
    {
      type: "rsvp",
      props: {
        title: {ar: "تأكيد الحضور", en: "RSVP"},
        subtitle: {ar: "نرجو منكم تأكيد الحضور في أقرب وقت ممكن.", en: "The favour of your response is requested as soon as you can."},
        bgUrl: "/assets/drafts/africa/rsvp-decoration.png",
        bottomUrl: "/assets/drafts/africa/rsvp-bottom.png",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2026-06-20T15:30:00+02:00",
        title: {ar: "العد التنازلي", en: "Countdown"},
        untilLabel: {ar: "حتى 20 يونيو 2026", en: "Until June 20, 2026"},
        bgImage: "/assets/drafts/africa/countdown-sunset.png",
        overlayImage: "/assets/drafts/africa/countdown-animals.png",
        showMonths: true,
      },
    },
    {
      type: "faq",
      props: {
        title: {ar: "الأسئلة الشائعة", en: "Frequently Asked Questions"},
        items: [
          {
            question: {ar: "متى يجب علينا تأكيد الحضور؟", en: "When do we need to RSVP by?"},
            answer: {ar: "نرجو منكم تأكيد الحضور قبل 30 سبتمبر.", en: "We kindly ask you to submit your RSVP before 30th September."},
          },
          {
            question: {ar: "هل ستقام مراسم الزفاف وحفل الاستقبال في نفس المكان؟", en: "Are the wedding ceremony and the reception at the same venue?"},
            answer: {ar: "نعم، سيقام كل من مراسم الزفاف وحفل الاستقبال في نفس المكان.", en: "Yes, both the ceremony and reception will be held at the same venue. Just get to the address, and from there, we'll make sure you don't get lost!"},
          },
          {
            question: {ar: "متى ينتهي حفل الزفاف؟", en: "When does the wedding end?"},
            answer: {ar: "سينتهي الحفل الرئيسي بحلول الساعة 10 مساءً.", en: "In our family, good sleep comes first and is non-negotiable. The main party will end by 10 pm, but if you wish to continue, an outside Boma area is available till midnight."},
          },
          {
            question: {ar: "هل أحتاج إلى معرفة اللغة الإنجليزية؟", en: "Do I need to know English?"},
            answer: {ar: "ستقام المراسم الرئيسية باللغة الإنجليزية، وسيكون هناك مترجم لضيوفنا الأجانب.", en: "The main ceremony will happen in English, but there will be a translator for our foreign guests."},
          },
          {
            question: {ar: "أين سنقيم؟", en: "Where will we stay?"},
            answer: {ar: "لقد وفرنا مكانًا للراحة للضيوف القادمين من السفر.", en: "We want everyone to feel at home. For guests who have traveled to be with us, we've taken care of a place to rest so you can enjoy the night fully."},
          },
          {
            question: {ar: "لماذا حفل زفافكم في جنوب أفريقيا؟", en: "Why is your wedding in South Africa?"},
            answer: {ar: "لأننا التقينا في جنوب أفريقيا ونخطط للعيش فيها.", en: "Because we met in South Africa, we fell in love in South Africa, and we plan to grow old here in South Africa. Trying to convince you to join!"},
          },
        ],
      },
    },
    {
      type: "credit",
      props: {
        coupleNames: {ar: "دانيال وأميليا", en: "Daniel & Amelia"},
        eventDate: {ar: "20 يونيو 2026", en: "20 June 2026"},
        creditLabel: {ar: "صنع بحب بواسطة", en: "Made with love by"},
        name: {ar: "The Digital Yes", en: "The Digital Yes"},
        monogramUrl: "/assets/drafts/africa/footer-frame.png",
      },
    },
  ],
};

const result = parseInvitationData(rawData);
if (!result.ok) {
  throw new Error(`Africa data validation failed: ${JSON.stringify(result.errors, null, 2)}`);
}
export const getAfricaData = () => result.data;
