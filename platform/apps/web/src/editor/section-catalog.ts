import type {SectionType} from '@platform/shared';

type EventType = 'engagement' | 'save-the-date' | 'wedding' | 'birthday';
type Text = {ar: string; en: string};

export interface SectionInfo {
  name: Text;
  hint: Text;
  /** Event types this section is suggested for ("Recommended" in the picker). */
  recommendedFor: readonly EventType[];
  /** Template-specific sections are tucked under "More" in the picker. */
  advanced: boolean;
  /** A valid, friendly starting point for a section added from the picker. */
  create: () => Record<string, unknown>;
}

const t = (ar: string, en: string): Text => ({ar, en});
const ALL: readonly EventType[] = ['engagement', 'save-the-date', 'wedding', 'birthday'];
const PARTY: readonly EventType[] = ['engagement', 'wedding', 'birthday'];
const ORNAMENT = '/assets/demo/mashrabiya/ornament.svg';

/** A countdown target a year from now, so a fresh section is valid and sensible. */
function nextYear(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return `${date.toISOString().slice(0, 10)}T19:00:00+02:00`;
}

export const SECTION_CATALOG: Record<SectionType, SectionInfo> = {
  hero: {name: t('الغلاف', 'Cover'), hint: t('الأسماء والتاريخ في أول الصفحة', 'Names and date at the top'), recommendedFor: ALL, advanced: false,
    create: () => ({firstName: t('العريس', 'Groom'), secondName: t('العروس', 'Bride'), displayDate: t('التاريخ', 'Date')})},
  countdown: {name: t('العد التنازلي', 'Countdown'), hint: t('أيام وساعات حتى المناسبة', 'Days and hours until the day'), recommendedFor: ALL, advanced: false,
    create: () => ({date: nextYear(), title: t('العد التنازلي', 'Countdown')})},
  welcome: {name: t('كلمة ترحيب', 'Welcome'), hint: t('رسالة قصيرة لضيوفكم', 'A short note to your guests'), recommendedFor: ALL, advanced: false,
    create: () => ({title: t('أهلًا بكم', 'Welcome'), body: t('يسعدنا أن تشاركونا هذه الفرحة.', 'We would be delighted to celebrate with you.')})},
  schedule: {name: t('برنامج اليوم', 'Schedule'), hint: t('مواعيد فقرات المناسبة', 'The timing of the day'), recommendedFor: PARTY, advanced: false,
    create: () => ({title: t('برنامج اليوم', 'Schedule'), subtitle: t('مواعيد المناسبة', 'The day at a glance'), items: [{title: t('استقبال الضيوف', 'Guests arrive'), time: t('7:00 م', '7:00 PM')}]})},
  details: {name: t('المكان والموعد', 'Venue and time'), hint: t('العنوان والوقت وخريطة', 'Address, time and map'), recommendedFor: ALL, advanced: false,
    create: () => ({title: t('المكان والموعد', 'Venue and time'), subtitle: t('نلتقي في', 'We meet at'), venue: t('اسم القاعة', 'Venue name'), startTime: t('7:00 م', '7:00 PM'), endTime: t('11:00 م', '11:00 PM'), mapUrl: 'https://www.google.com/maps'})},
  map: {name: t('الخريطة', 'Map'), hint: t('خريطة مدمجة للموقع', 'An embedded map'), recommendedFor: ALL, advanced: false,
    create: () => ({title: t('الموقع', 'Location'), src: 'https://www.google.com/maps?q=Cairo&output=embed'})},
  messageForm: {name: t('سجل التهاني', 'Guestbook'), hint: t('رسائل التهنئة من الضيوف', 'Messages from your guests'), recommendedFor: PARTY, advanced: false,
    create: () => ({title: t('سجل التهاني', 'Guestbook'), subtitle: t('اتركوا لنا كلمة', 'Leave us a note')})},
  imageDivider: {name: t('فاصل مصوّر', 'Image divider'), hint: t('صورة تفصل بين الأقسام', 'A picture between sections'), recommendedFor: [], advanced: true,
    create: () => ({imageUrl: ORNAMENT})},
  footer: {name: t('الخاتمة', 'Footer'), hint: t('زخرفة ختامية', 'A closing ornament'), recommendedFor: [], advanced: true,
    create: () => ({ornamentUrl: ORNAMENT})},
  scratchReveal: {name: t('كشط وإظهار', 'Scratch to reveal'), hint: t('صورة تُكشط لإظهار التفاصيل', 'Scratch a photo to reveal details'), recommendedFor: [], advanced: true,
    create: () => ({photoUrl: ORNAMENT, label: t('اكشطوا', 'Scratch'), firstName: t('العريس', 'Groom'), secondName: t('العروس', 'Bride'), date: t('التاريخ', 'Date'), location: t('المكان', 'Place')})},
  story: {name: t('قصتنا', 'Our story'), hint: t('فصول من حكايتكم', 'Chapters of your story'), recommendedFor: ['engagement', 'wedding'], advanced: false,
    create: () => ({title: t('قصتنا', 'Our story'), chapters: [{prose: t('بدأت حكايتنا…', 'Our story began…')}]})},
  dressCode: {name: t('الملابس', 'Dress code'), hint: t('ما يُنصح بارتدائه', 'What to wear'), recommendedFor: PARTY, advanced: false,
    create: () => ({title: t('الملابس', 'Dress code'), body: t('أناقة بألوان هادئة.', 'Elegant, in soft colours.')})},
  gifts: {name: t('الهدايا', 'Gifts'), hint: t('ملاحظة عن الهدايا', 'A note about gifts'), recommendedFor: ['engagement', 'wedding'], advanced: false,
    create: () => ({title: t('الهدايا', 'Gifts'), body: t('حضوركم أجمل هدية.', 'Your presence is the best gift.')})},
  rsvp: {name: t('تأكيد الحضور', 'RSVP'), hint: t('ضيوفكم يؤكدون الحضور هنا', 'Guests reply here'), recommendedFor: ALL, advanced: false,
    create: () => ({title: t('تأكيد الحضور', 'Will you join us?'), subtitle: t('يسعدنا حضوركم', 'We would love to see you')})},
  faq: {name: t('أسئلة شائعة', 'FAQ'), hint: t('إجابات لأسئلة الضيوف', 'Answers to common questions'), recommendedFor: PARTY, advanced: false,
    create: () => ({title: t('أسئلة شائعة', 'Questions'), items: [{question: t('هل يمكن اصطحاب الأطفال؟', 'Can we bring children?'), answer: t('بالتأكيد.', 'Of course.')}]})},
  weddingWeekend: {name: t('أيام الفرح', 'Wedding weekend'), hint: t('عدة فعاليات على أيام', 'Several events over days'), recommendedFor: [], advanced: true,
    create: () => ({eyebrow: t('نحتفل معًا', 'Celebrating together'), title: t('أيام الفرح', 'Wedding weekend'), body: t('برنامج الاحتفال.', 'The plan for the celebration.'), events: []})},
  travelInfo: {name: t('السفر', 'Travel'), hint: t('مطارات وإرشادات', 'Airports and tips'), recommendedFor: [], advanced: true,
    create: () => ({eyebrow: t('السفر', 'Getting here'), title: t('السفر', 'Travel'), body: t('إرشادات الوصول.', 'How to get here.'), airports: []})},
  bohoFooter: {name: t('خاتمة بوهو', 'Boho footer'), hint: t('أسماء وتاريخ في الختام', 'Names and date to close'), recommendedFor: [], advanced: true,
    create: () => ({names: t('العريس والعروس', 'Groom and Bride'), month: t('يونيو', 'June'), year: t('٢٠٢٧', '2027')})},
  credit: {name: t('اعتماد', 'Credit'), hint: t('اسم المصمم', 'Designer credit'), recommendedFor: [], advanced: true, create: () => ({})},
  hotelList: {name: t('الفنادق', 'Hotels'), hint: t('أماكن إقامة مقترحة', 'Suggested places to stay'), recommendedFor: ['wedding'], advanced: true,
    create: () => ({title: t('الإقامة', 'Where to stay'), hotels: []})},
  gallery: {name: t('معرض الصور', 'Gallery'), hint: t('صور من رحلتكم', 'Photos from your journey'), recommendedFor: ['engagement', 'wedding', 'birthday'], advanced: false,
    create: () => ({title: t('لحظاتنا', 'Our moments'), images: []})},
  locationTransport: {name: t('المواصلات', 'Transport'), hint: t('الوصول والمواصلات', 'Getting around'), recommendedFor: [], advanced: true, create: () => ({})}
};

export function recommendedFor(eventType: EventType): SectionType[] {
  return (Object.keys(SECTION_CATALOG) as SectionType[]).filter((type) => SECTION_CATALOG[type].recommendedFor.includes(eventType));
}
