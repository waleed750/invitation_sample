export type FormatLocale = 'ar' | 'en';

/** Whole EGP prices, with Western digits and stable punctuation in both locales. */
export function formatMoney(amount: number, locale: FormatLocale): string {
  const number = new Intl.NumberFormat('en-US', {
    numberingSystem: 'latn', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);
  return locale === 'ar' ? `${number} ج.م` : `EGP ${number}`;
}

/** UTC keeps calendar dates stable across server and browser time zones. */
export function formatDate(date: Date | string | number, locale: FormatLocale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn', timeZone: 'UTC'
  }).format(new Date(date));
}
