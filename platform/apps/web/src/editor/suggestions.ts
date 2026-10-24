/**
 * Ready-made wording, curated by hand (no AI): short phrases per section field that a customer can apply in one tap.
 * Keys are `<sectionType>.<fieldKey>`.
 */
export interface Suggestion {
  ar: string;
  en: string;
}

export const SUGGESTIONS: Record<string, Suggestion[]> = {
  'hero.headline': [
    {ar: 'بكل حب ندعوكم لحضور حفل زفافنا', en: 'With love, we invite you to our wedding'},
    {ar: 'يسعدنا دعوتكم لمشاركتنا فرحة العمر', en: 'We would be honoured to have you share our joy'},
    {ar: 'احتفلوا معنا بخطوبتنا', en: 'Celebrate our engagement with us'}
  ],
  'welcome.title': [
    {ar: 'أهلًا وسهلًا بكم', en: 'Welcome'},
    {ar: 'مرحبًا بأحبّتنا', en: 'Welcome, dear friends and family'}
  ],
  'welcome.body': [
    {ar: 'يسعدنا ويشرفنا أن تشاركونا فرحة العمر واجتماع العائلتين في ليلة تملؤها المحبة.', en: 'We would be delighted and honoured to have you share this joyful day as our two families come together.'},
    {ar: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً', en: 'And among His signs is that He created for you mates from among yourselves, that you may find tranquillity in them, and He placed between you affection and mercy. (Quran 30:21)'},
    {ar: 'بارك الله لنا ولكم، ونسأل الله أن يجمعنا دائمًا على الخير.', en: 'May God bless us all, and keep us together in goodness.'}
  ],
  'rsvp.title': [
    {ar: 'تأكيد الحضور', en: 'Will you join us?'},
    {ar: 'هل ستشاركوننا الفرحة؟', en: 'Will you celebrate with us?'}
  ],
  'rsvp.subtitle': [
    {ar: 'يرجى تأكيد حضوركم قبل موعد المناسبة بأسبوع', en: 'Please let us know a week before the day'},
    {ar: 'حضوركم يسعدنا ويكمل فرحتنا', en: 'Your presence completes our joy'}
  ],
  'rsvp.successMessage': [
    {ar: 'شكرًا لكم! وصلنا ردّكم ونتطلع لرؤيتكم', en: 'Thank you! We received your reply and look forward to seeing you'}
  ],
  'messageForm.title': [
    {ar: 'سجل التهاني', en: 'Guestbook'},
    {ar: 'اتركوا لنا كلمة', en: 'Leave us a message'}
  ],
  'messageForm.subtitle': [
    {ar: 'كلماتكم الطيبة تسعدنا', en: 'Your kind words mean the world to us'}
  ],
  'gifts.body': [
    {ar: 'حضوركم هو أجمل هدية. وإن أردتم مشاركتنا فرحتنا بهدية فسنكون ممتنين.', en: 'Your presence is the best gift. If you wish to give something, we will be grateful.'},
    {ar: 'نقدّر لكم محبتكم، وسنكون سعداء بأي مشاركة تختارونها.', en: 'We appreciate your love and are happy with whatever you choose to share.'}
  ],
  'dressCode.body': [
    {ar: 'أناقة بألوان هادئة، ونرحب بالزي التقليدي.', en: 'Elegant attire in soft colours; traditional dress is welcome.'},
    {ar: 'اللون الأبيض محجوز للعروس، وباقي الألوان مرحّب بها.', en: 'White is reserved for the bride; all other colours are welcome.'}
  ],
  'details.title': [
    {ar: 'المكان والموعد', en: 'Venue and time'},
    {ar: 'نلتقي في', en: 'Where we meet'}
  ],
  'schedule.title': [
    {ar: 'برنامج اليوم', en: 'The day at a glance'}
  ],
  'story.title': [
    {ar: 'حكايتنا', en: 'Our story'},
    {ar: 'كيف بدأ كل شيء', en: 'How it all began'}
  ],
  'faq.title': [
    {ar: 'أسئلة شائعة', en: 'Good to know'}
  ],
  'countdown.title': [
    {ar: 'العد التنازلي ليوم فرحنا', en: 'Counting down to our day'},
    {ar: 'بقي القليل', en: 'Not long now'}
  ],
  'gallery.title': [
    {ar: 'لحظاتنا', en: 'Our moments'},
    {ar: 'من ألبوم ذكرياتنا', en: 'From our album'}
  ]
};

export function suggestionsFor(sectionType: string, field: string): Suggestion[] {
  return SUGGESTIONS[`${sectionType}.${field}`] ?? [];
}
