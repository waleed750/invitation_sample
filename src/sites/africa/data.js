const introPosterUrl = "/assets/africa/intro-poster.jpg";
const introVideoUrl = "/assets/africa/intro-video.mp4";
const heroVideoUrl = "/assets/africa/hero-video.mp4";
const heroPosterUrl = "/assets/africa/hero-poster.jpg";
const musicUrl = "/assets/africa/background-music.mp3";

export const invitationData = {
  template: {
    eventType: "wedding",
    siteType: "full-invitation",
    experienceType: "cinematic-story",
    introType: "video-open",
    layoutFamily: "safari-editorial",
  },
  theme: {
    background: "#f2e8dc",
    foreground: "#4e2522",
    muted: "#cfc0aa",
    ivory: "#f5e1c8",
  },
  couple: {
    firstName: "Daniel",
    secondName: "Amelia",
    headline: "Two Worlds. One Family",
  },
  event: {
    date: "2027-01-21T15:30:00+02:00",
    displayDate: "Thursday, January 21, 2027",
    startTime: "3:30 PM",
    endTime: "10:00 PM",
    venue: "24 Kiepersolweg, Rayton, 0001, South Africa",
  },
  media: {
    introPosterUrl,
    introVideoUrl,
    heroVideoUrl,
    heroPosterUrl,
    musicUrl,
  },
  copy: {
    tapLabel: "Tap to open",
  },
  sections: [
    {
      type: "hero",
      props: {
        headline: "We're getting married",
        firstName: "Daniel",
        secondName: "Amelia",
        displayDate: "Thursday, January 21, 2027",
        heroVideoUrl,
        heroPosterUrl,
        ctaLabel: "KEEP SCROLLING & RSVP",
      },
    },
    {
      type: "welcome",
      props: {
        title: "Two Worlds. One Family",
        body: "Amelia flew into South Africa for a work event \u2014 and left three days later engaged. We'll let that sink in.\nA fiercely independent feminist met a kind-hearted, Christian farm boy. Neither stood a chance.\n\nWe like to say our marriage was arranged \u2014 by a loving and wise Father, who brought us together from different corners of the world to prove that love has no rules, no limits, and no doubts.\n\nNow, to celebrate this beautiful union, we invite you \u2014 the people we love most \u2014 to witness two worlds becoming one family.\n\nWelcome to our wedding. We're so glad you're here.",
        bgUrl: "/assets/africa/welcome-bg.png",
      },
    },
    {
      type: "story",
      props: {
        title: "A trip down memory lane",
        birdsFrame1: "/assets/africa/birds-frame-1.png",
        birdsFrame2: "/assets/africa/birds-frame-2.png",
        chapters: [
          {
            quote: "Do you want to dance?",
            prose: "It started, as most good stories do, with a song neither of them knew the name of.\nAmelia had wandered into a rooftop bar in the old city of Cartagena, looking for nothing in particular \u2014 maybe a breeze, maybe a mojito, definitely not love. Daniel was on the other side of the dance floor, pretending he wasn't watching her pretend she wasn't watching him.\nFour songs in, he finally crossed the room and asked the only question that mattered: \"Do you want to dance?\"\nShe said yes before her brain could veto her feet. They danced badly. They danced beautifully. They danced until the lanterns went out \u2014 and somewhere between the bougainvillea and the second chorus, Cartagena decided their fate for them.",
            photos: [
              "/assets/africa/story-1.jpg",
              "/assets/africa/story-2.jpg",
              "/assets/africa/story-3.jpg",
            ],
          },
          {
            quote: "Do you want to meet my family?",
            prose: "Three months in, Daniel announced they were going to lunch with his family. \"Just a small one,\" he said. \"Maybe twelve people. Fifteen, tops.\"\nThere were thirty-two.\nThere were aunts who hugged Amelia like they'd known her since birth, cousins who insisted she try every plate on the table, and an abuela who took one look at her and quietly said, \"Esta se queda\" \u2014 this one stays.\nBy dessert, Amelia had been adopted, renamed, and entered into a group chat she still doesn't fully understand. Daniel just smiled. He'd known how it would go from the moment he asked her to come.",
            photos: [
              "/assets/africa/story-4.jpg",
              "/assets/africa/story-5.jpg",
              "/assets/africa/story-6.jpg",
            ],
          },
          {
            quote: "Do you want to be my wife?",
            prose: "A year later, Daniel suggested a sunset walk along the old city walls. \"Just a walk,\" he said. Suspiciously casual. Suspiciously well-dressed.\nThe Caribbean was doing its showing-off thing \u2014 gold, pink, ridiculous. Somewhere between the cannons and the last bend before the sea, Daniel slowed down, took her hand, and dropped to one knee.\nAmelia, who had imagined this moment in roughly four hundred different ways, forgot every one of them.\nWhat she actually said is still a matter of debate. Daniel claims it was \"yes.\" Amelia claims it was \"obviously.\" The waves, the only other witnesses, have politely refused to comment.",
            photos: [
              "/assets/africa/story-7.jpg",
              "/assets/africa/story-8.jpg",
              "/assets/africa/story-9.jpg",
            ],
          },
        ],
      },
    },
    {
      type: "dressCode",
      props: {
        title: "Dress Code",
        body: "We'd love for our guests to feel comfortable and carefree in the summer warmth. Think flowing dresses and light natural fabrics for the ladies, and relaxed shirts and trousers for the gentlemen.\n\nAs for colors, let yourself be inspired by an African sunset \u2014 warm browns, sandy creams, dusty pinks, golden ambers, and rich terracottas. Colors that glow like the horizon at dusk, alive with the warmth of the land.",
        illustrationUrl: "/assets/africa/dress-code-illustration.png",
      },
    },
    {
      type: "gifts",
      props: {
        title: "Gifts & Wishes",
        body: "Your presence at our wedding is the greatest gift of all.\nShould you wish to give a little something, contributions to our newlywed fund are warmly welcomed.\nOtherwise, any heartfelt gift, a kind word, or a sincere prayer would be treasured just as much.",
        bgUrl: "/assets/africa/gifts-bg.png",
      },
    },
    {
      type: "schedule",
      props: {
        title: "Schedule",
        subtitle: null,
        items: [
          { title: "Welcoming with drinks", time: "3:30pm", description: "3:30pm" },
          { title: "Ceremony", time: "4:00pm", description: "4:00pm" },
          { title: "Cocktails & Canap\u00e9", time: "4:30pm", description: "4:30pm" },
          { title: "Reception", time: "5:30pm", description: "5:30pm" },
        ],
        bgUrl: "/assets/africa/schedule-bg.png",
      },
    },
    {
      type: "rsvp",
      props: {
        title: "RSVP",
        subtitle: "The favour of your response is requested as soon as you can.",
        bgUrl: "/assets/africa/rsvp-decoration.png",
        bottomUrl: "/assets/africa/rsvp-bottom.png",
      },
    },
    {
      type: "countdown",
      props: {
        date: "2027-01-21T15:30:00+02:00",
        title: "Countdown",
        untilLabel: "Until January 21, 2027",
        bgImage: "/assets/africa/countdown-sunset.png",
        overlayImage: "/assets/africa/countdown-animals.png",
        showMonths: true,
      },
    },
    {
      type: "faq",
      props: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "When do we need to RSVP by?",
            answer: "We kindly ask you to submit your RSVP before 30th September.",
          },
          {
            question: "Are the wedding ceremony and the reception at the same venue?",
            answer: "Yes, both the ceremony and reception will be held at the same venue. Just get to the address, and from there, we'll make sure you don't get lost!",
          },
          {
            question: "When does the wedding end?",
            answer: "In our family, good sleep comes first and is non-negotiable. The main party will end by 10 pm, but if you wish to continue, an outside Boma area is available till midnight.",
          },
          {
            question: "Do I need to know English?",
            answer: "The main ceremony will happen in English, but there will be a translator for our foreign guests.",
          },
          {
            question: "Where will we stay?",
            answer: "We want everyone to feel at home. For guests who have traveled to be with us, we've taken care of a place to rest so you can enjoy the night fully.",
          },
          {
            question: "Why is your wedding in South Africa?",
            answer: "Because we met in South Africa, we fell in love in South Africa, and we plan to grow old here in South Africa. Trying to convince you to join!",
          },
        ],
      },
    },
    {
      type: "footer",
      props: {
        names: "Daniel & Amelia",
        date: "21 January 2027",
        creditLine: "Made with love by",
        creditName: "The Digital Yes",
        frameUrl: "/assets/africa/footer-frame.png",
      },
    },
  ],
};

export const siteMeta = {
  id: "africa",
  title: "Africa Safari Wedding",
  category: "Full Invitation",
  eventType: "Wedding",
  status: "Converted demo",
  href: "/africa/",
  summary: "Safari editorial wedding: envelope video intro, story chapters with scrolling photos, countdown, RSVP form, and FAQ.",
  tags: ["video open", "music", "story", "countdown", "rsvp", "faq", "safari", "scroll"],
  template: invitationData.template,
  preview: {
    imageUrl: "/assets/africa/intro-poster.jpg",
    accent: "#b05233",
  },
};
