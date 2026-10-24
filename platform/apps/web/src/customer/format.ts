/** Money for receipts: amounts keep their piasters. Latin digits in both languages (the dashboard convention). */
export function formatEgp(amount: number, locale: 'ar' | 'en'): string {
  const number = new Intl.NumberFormat('en-US', {numberingSystem: 'latn', minimumFractionDigits: 2, maximumFractionDigits: 2}).format(amount);
  return locale === 'ar' ? `${number} ج.م` : `EGP ${number}`;
}

/** The short order code customers see everywhere (`#D-1A2B3C4D`). */
export function orderCode(id: string): string {
  return `#D-${id.slice(0, 8).toUpperCase()}`;
}
