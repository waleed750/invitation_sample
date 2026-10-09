import type {Tier} from '@platform/shared';

export const NAME_MAX = 30;

export type SearchParams = Record<string, string | string[] | undefined>;

export type PickDetails = {
  first: string;
  second: string;
  /** ISO calendar date (YYYY-MM-DD) or empty string when missing/invalid. */
  date: string;
};

export type PickParseResult = PickDetails & {
  complete: boolean;
  errors: {first?: 'missing'; second?: 'missing'; date?: 'missing' | 'invalid' | 'past'};
};

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/** Collapses whitespace, strips control chars and the separators checkout uses to split names. */
export function cleanName(raw: string): string {
  const stripped = raw.replace(/[\u0000-\u001f\u007f&<>,]/gu, ' ').replace(/\s+/gu, ' ').trim();
  return Array.from(stripped).slice(0, NAME_MAX).join('').trim();
}

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 2000 || year > 2100) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

/** `today` is an ISO date; dates before it are rejected. Omit to skip the past check. */
export function parsePickParams(params: SearchParams, today?: string): PickParseResult {
  const first = cleanName(one(params.first));
  const second = cleanName(one(params.second));
  const rawDate = one(params.date).trim();
  const errors: PickParseResult['errors'] = {};
  let date = '';
  if (!first) errors.first = 'missing';
  if (!second) errors.second = 'missing';
  if (!rawDate) errors.date = 'missing';
  else if (!isValidIsoDate(rawDate)) errors.date = 'invalid';
  else if (today && rawDate < today) errors.date = 'past';
  else date = rawDate;
  return {first, second, date, complete: Object.keys(errors).length === 0, errors};
}

export function detailsQuery(details: PickDetails, extra: Record<string, string> = {}): string {
  const query = new URLSearchParams();
  if (details.first) query.set('first', details.first);
  if (details.second) query.set('second', details.second);
  if (details.date) query.set('date', details.date);
  for (const [key, value] of Object.entries(extra)) query.set(key, value);
  return query.toString();
}

/** Locale-less app path (next-intl `Link` adds the locale). */
export function templateStepHref(slug: string, details: PickDetails, tier?: Tier): string {
  return `/app/new/${slug}?${detailsQuery(details, tier ? {tier} : {})}`;
}

export function gridHref(details: PickDetails): string {
  const query = detailsQuery(details);
  return query ? `/app/new?${query}` : '/app/new';
}

/** Existing checkout accepts tier, kind, names ("A & B") and date (YYYY-MM-DD). */
export function checkoutHref(slug: string, tier: Tier, details: PickDetails): string {
  const query = new URLSearchParams({tier});
  const names = [details.first, details.second].filter(Boolean).join(' & ');
  if (names) query.set('names', names);
  if (details.date) query.set('date', details.date);
  return `/checkout/${slug}?${query.toString()}`;
}

export function previewFrameSrc(locale: string, slug: string, details: PickDetails): string {
  return `/${locale}/pick-preview/${slug}?${detailsQuery(details)}`;
}
