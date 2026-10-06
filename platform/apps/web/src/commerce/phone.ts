const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

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

