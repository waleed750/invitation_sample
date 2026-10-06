import {parseInvitationData, type InvitationData} from '@platform/shared';

// All artwork below is original watercolor-style SVG drawn for Rawda (see ASSET_LICENSES.md).
const art = (name: string) => `/assets/demo/rawda/${name}.svg`;
const mapUrl = 'https://www.google.com/maps/search/?api=1&query=New+Cairo';
const date = '2027-06-11T19:00:00+03:00';

const firstName = {ar: 'كريم', en: 'Karim'};
const secondName = {ar: 'ليلى', en: 'Layla'};
const headline = {ar: 'بفرحةٍ تملأ القلب ندعوكم إلى زفاف', en: 'Together with their families'};
const displayDate = {ar: 'الجمعة · 11 يونيو 2027', en: 'Friday · 11 June 2027'};
const venue = {ar: 'حديقة النخيل · القاهرة الجديدة', en: 'Palm Garden · New Cairo'};
const welcome = {
  ar: 'في مساءٍ صيفي بين الورد والشموع، يسعدنا أن تكونوا معنا ونحن نبدأ حكايتنا الجديدة.',
  en: 'On a summer evening among roses and candlelight, we would love you beside us as our new chapter begins.',
};

export const rawdaData: InvitationData = {
  template: {
    eventType: 'wedding',
    siteType: 'full-invitation',
    experienceType: 'interactive-reveal',
    introType: 'tap-to-open',
    layoutFamily: 'classic',
  },
  theme: {
    background: '#f8f5ee',
    foreground: '#1f2a24',
    muted: '#4f6457',
    ivory: '#f8f5ee',
  },
  couple: {firstName, secondName, headline},
  event: {date, displayDate, venue, mapUrl},
  media: {
    footerOrnamentUrl: art('monogram-ring'),
    ornamentUrl: art('divider'),
  },
  copy: {
    tapLabel: {ar: 'المس لفتح الستار', en: 'Tap to part the curtains'},
    welcomeTitle: {ar: 'يسعدنا حضوركم', en: 'You are warmly invited'},
    welcome,
    detailsTitle: {ar: 'المكان', en: 'The Venue'},
    detailsSubtitle: {ar: 'حيث نلتقي', en: 'Where we gather'},
  },
  sections: [
    {
      type: 'hero',
      props: {headline, firstName, secondName, displayDate},
    },
    {
      type: 'imageDivider',
      props: {imageUrl: art('divider')},
    },
    {
      type: 'countdown',
      props: {
        date,
        kicker: {ar: 'على موعدٍ قريب', en: 'Until we say yes'},
        title: {ar: 'العدّ التنازلي', en: 'The Countdown'},
        showSeconds: false,
        columnLeftUrl: art('urn-roses'),
        columnRightUrl: art('urn-roses'),
        labels: {
          days: {ar: 'يوم', en: 'Days'},
          hours: {ar: 'ساعة', en: 'Hours'},
          minutes: {ar: 'دقيقة', en: 'Minutes'},
        },
      },
    },
    {
      type: 'welcome',
      props: {
        kicker: {ar: 'الأمسية', en: 'The evening'},
        title: {ar: 'يسعدنا حضوركم', en: 'You are warmly invited'},
        body: welcome,
        cards: [
          {
            kicker: {ar: 'عقد القران والاستقبال', en: 'Ceremony & reception'},
            heading: venue,
            date: displayDate,
            time: {ar: '7:00 مساءً', en: '7:00 in the evening'},
            imageUrl: art('event-ceremony'),
            mapUrl,
            mapLabel: {ar: 'عرض الموقع', en: 'View on the map'},
          },
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
        addressLines: [
          {ar: 'حديقة النخيل', en: 'Palm Garden'},
          {ar: 'القاهرة الجديدة، مصر', en: 'New Cairo, Egypt'},
        ],
        mapUrl,
        mapLabel: {ar: 'افتح في خرائط جوجل', en: 'Open in Google Maps'},
      },
    },
    {
      type: 'rsvp',
      props: {
        title: {ar: 'تأكيد الحضور', en: 'Kindly Reply'},
        subtitle: {ar: 'نرجو الرد قبل 1 مايو 2027', en: 'We hope to hear from you by 1 May 2027'},
        guestCountMode: 'stepper',
        attendingLabel: {ar: 'هل ستشاركوننا الفرحة؟', en: 'Will you join us?'},
        attendanceOptions: {
          yes: {ar: 'بكل سرور، سأحضر', en: 'Joyfully accepts'},
          no: {ar: 'أعتذر عن الحضور', en: 'Regretfully declines'},
        },
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
      type: 'footer',
      props: {ornamentUrl: art('monogram-ring')},
    },
  ],
};

export function getRawdaData(): InvitationData {
  const result = parseInvitationData(rawdaData);
  if (!result.ok) {
    throw new Error(`Invalid rawda demo: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}
