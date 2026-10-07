const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Normalizes an Egyptian mobile number to E.164 (`+201xxxxxxxxx`).
 * Accepts `01x…`, `+201x…`, `00201x…`, `201x…` (Arabic-Indic digits and
 * spaces/dashes tolerated). Returns `null` when the input is not a valid
 * Egyptian mobile (valid prefixes: 010, 011, 012, 015).
 */
export function normalizeEgyptPhone(input: string): string | null {
  const western = [...input].map((character) => {
    const index = ARABIC_INDIC_DIGITS.indexOf(character);
    return index === -1 ? character : String(index);
  }).join('');
  const compact = western.replace(/[\s-]/g, '');

  let local: string;
  if (/^01\d{9}$/.test(compact)) local = compact;
  else if (/^\+201\d{9}$/.test(compact)) local = `0${compact.slice(3)}`;
  else if (/^00201\d{9}$/.test(compact)) local = `0${compact.slice(4)}`;
  else if (/^201\d{9}$/.test(compact)) local = `0${compact.slice(2)}`;
  else return null;

  return /^01(?:0|1|2|5)\d{8}$/.test(local) ? `+20${local.slice(1)}` : null;
}
