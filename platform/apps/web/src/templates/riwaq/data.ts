import {parseInvitationData, type InvitationData} from '@platform/shared';

// Original media for Riwaq goes in /assets/demo/riwaq/. Until the owner's generated videos and music are
// dropped in, the page runs on poster images only; flip these flags when the files exist.
const MEDIA_READY = {introVideo: false, heroVideo: false, music: false};

const art = (name: string) => `/assets/demo/riwaq/${name}`;
const mapUrl = 'https://www.google.com/maps/search/?api=1&query=New+Cairo%2C+Cairo';
const date = '2027-10-15T19:00:00+03:00';

const firstName = {ar: 'مالك', en: 'Malek'};
const secondName = {ar: 'ريم', en: 'Reem'};
const headline = {ar: 'بقلوبٍ ممتنة ندعوكم لمشاركتنا فرحتنا', en: 'With grateful hearts, we invite you to celebrate with us'};
const displayDate = {ar: 'الجمعة · 15 أكتوبر 2027', en: 'Friday · 15 October 2027'};
const venue = {ar: 'قصر الأعمدة · القاهرة الجديدة', en: 'The Colonnade Palace · New Cairo'};

export const riwaqData: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'cinematic-story',
    introType: 'video-open',
    layoutFamily: 'classic',
  },
  theme: {background: '#f8f5ee', foreground: '#1f2a24', muted: '#4f6457', ivory: '#f8f5ee'},
  couple: {firstName, secondName, headline},
  event: {date, displayDate, venue, mapUrl},
  media: {
    introPosterUrl: art('intro-poster.jpg'),
    ...(MEDIA_READY.introVideo ? {introVideoUrl: art('intro-video.mp4')} : {}),
    ...(MEDIA_READY.music ? {musicUrl: art('background-music.mp3')} : {}),
  },
  copy: {tapLabel: {ar: 'المس لتفتح الستار', en: 'Touch to part the curtains'}},
  sections: [
    {
      type: 'hero',
      props: {
        headline, firstName, secondName, displayDate,
        heroPosterUrl: art('hero-poster.jpg'),
        ...(MEDIA_READY.heroVideo ? {heroVideoUrl: art('hero-video.mp4')} : {}),
        heroVideoLoop: true,
        showOverlayCopy: true,
      },
    },
    {
      type: 'countdown',
      props: {
        date,
        kicker: {ar: 'نقترب من الموعد', en: 'The day is near'},
        title: {ar: 'العدّ التنازلي', en: 'The Countdown'},
        showSeconds: false,
        columnLeftUrl: art('column.png'),
        columnRightUrl: art('column.png'),
        labels: {days: {ar: 'يوم', en: 'Days'}, hours: {ar: 'ساعة', en: 'Hours'}, minutes: {ar: 'دقيقة', en: 'Minutes'}},
      },
    },
    {
      type: 'welcome',
      props: {
        kicker: {ar: 'أمسيتان', en: 'Two evenings'},
        title: {ar: 'نحتفل معكم على مرحلتين', en: 'We celebrate in two evenings'},
        body: {
          ar: 'ليلة الحنة بين الأهل والأصدقاء، ثم حفل الزفاف في رواق القصر.',
          en: 'A henna night among family and friends, then the wedding in the palace colonnade.',
        },
        cards: [
          {
            kicker: {ar: 'ليلة الحنة', en: 'The henna night'},
            heading: {ar: 'شرفة الحديقة', en: 'The Garden Terrace'},
            date: {ar: 'الأربعاء · 13 أكتوبر 2027', en: 'Wednesday · 13 October 2027'},
            time: {ar: '7:00 مساءً', en: '7:00 in the evening'},
            imageUrl: art('event-welcome.png'),
            mapUrl,
            mapLabel: {ar: 'عرض الموقع', en: 'View on the map'},
          },
          {
            kicker: {ar: 'حفل الزفاف', en: 'The wedding'},
            heading: venue,
            date: displayDate,
            time: {ar: '7:00 مساءً', en: '7:00 in the evening'},
            imageUrl: art('event-venue.png'),
            mapUrl,
            mapLabel: {ar: 'عرض الموقع', en: 'View on the map'},
          },
        ],
      },
    },
    {
      type: 'schedule',
      props: {
        title: {ar: 'برنامج الأمسية', en: 'The Evening'},
        subtitle: {ar: 'على ضوء الشموع', en: 'By candlelight'},
        bgUrl: art('candles.jpg'),
        items: [
          {title: {ar: 'استقبال الضيوف', en: 'Guests arrive'}, time: {ar: '7:00 م', en: '7:00 PM'}},
          {title: {ar: 'دخول العروسين', en: 'The couple enters'}, time: {ar: '8:00 م', en: '8:00 PM'}},
          {title: {ar: 'العشاء', en: 'Dinner'}, time: {ar: '9:00 م', en: '9:00 PM'}},
          {title: {ar: 'الرقصة الأولى', en: 'First dance'}, time: {ar: '10:30 م', en: '10:30 PM'}},
        ],
        stops: [
          {time: {ar: '7:00 م', en: '7:00 PM'}, text: {ar: 'استقبال الضيوف', en: 'Guests arrive'}},
          {time: {ar: '8:00 م', en: '8:00 PM'}, text: {ar: 'دخول العروسين', en: 'The couple enters'}},
          {time: {ar: '9:00 م', en: '9:00 PM'}, text: {ar: 'العشاء', en: 'Dinner'}},
          {time: {ar: '10:30 م', en: '10:30 PM'}, text: {ar: 'الرقصة الأولى', en: 'First dance'}},
        ],
      },
    },
    {
      type: 'dressCode',
      props: {
        title: {ar: 'الزي المقترح', en: 'Dress Code'},
        body: {ar: 'أناقة المساء: ألوان هادئة مع لمسة عاجية أو ذهبية.', en: 'Evening elegance: calm tones with a touch of ivory or gold.'},
        groups: [
          {heading: {ar: 'ليلة الحنة', en: 'Henna night'}, body: {ar: 'ملابس مريحة بألوان دافئة.', en: 'Comfortable outfits in warm colours.'}},
          {heading: {ar: 'حفل الزفاف', en: 'The wedding'}, body: {ar: 'ملابس رسمية أنيقة.', en: 'Formal evening wear.'}},
        ],
      },
    },
    {
      type: 'details',
      props: {
        title: {ar: 'المكان', en: 'The Venue'},
        subtitle: {ar: 'حيث نلتقي', en: 'Where we gather'},
        venue,
        startTime: {ar: '7:00 م', en: '7:00 PM'},
        endTime: {ar: '12:00 ص', en: '12:00 AM'},
        addressLines: [{ar: 'قصر الأعمدة', en: 'The Colonnade Palace'}, {ar: 'القاهرة الجديدة', en: 'New Cairo'}],
        mapUrl,
        mapLabel: {ar: 'افتح في خرائط جوجل', en: 'Open in Google Maps'},
      },
    },
    {
      type: 'rsvp',
      props: {
        title: {ar: 'تأكيد الحضور', en: 'Kindly Reply'},
        subtitle: {ar: 'نرجو الرد قبل 1 أكتوبر 2027', en: 'We hope to hear from you by 1 October 2027'},
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
    {type: 'footer', props: {ornamentUrl: art('seal.jpg')}},
  ],
};

export function getRiwaqData(): InvitationData {
  const result = parseInvitationData(riwaqData);
  if (!result.ok) throw new Error(`Invalid riwaq demo: ${JSON.stringify(result.errors)}`);
  return result.data;
}
