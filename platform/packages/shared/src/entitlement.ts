export const TIERS = {
  'save-the-date': {price: 499, editsAllowed: 5, onlineMonths: 3, graceDaysAfterEvent: 7, templateSwitches: 1, rsvpLimit: 0, videoIntro: false, musicUpload: false, guestMessages: false, prioritySupport: false},
  classic: {price: 1299, editsAllowed: 15, onlineMonths: 6, graceDaysAfterEvent: 14, templateSwitches: 2, rsvpLimit: 300, videoIntro: false, musicUpload: false, guestMessages: false, prioritySupport: false},
  premium: {price: 2499, editsAllowed: 40, onlineMonths: 12, graceDaysAfterEvent: 30, templateSwitches: null, rsvpLimit: null, videoIntro: true, musicUpload: true, guestMessages: true, prioritySupport: true}
} as const satisfies Record<string, {price: number; editsAllowed: number; onlineMonths: number; graceDaysAfterEvent: number; templateSwitches: number | null; rsvpLimit: number | null; videoIntro: boolean; musicUpload: boolean; guestMessages: boolean; prioritySupport: boolean}>;
export type Tier = keyof typeof TIERS;
export type DbTier = 'save_the_date' | 'classic' | 'premium';
export const TIER_ORDER = ['save-the-date', 'classic', 'premium'] as const satisfies readonly Tier[];
export function toDbTier(tier: Tier): DbTier {
  return tier === 'save-the-date' ? 'save_the_date' : tier;
}
export function fromDbTier(value: string): Tier {
  if (value === 'save_the_date') return 'save-the-date';
  if (value === 'classic' || value === 'premium') return value;
  throw new RangeError(`Unknown database tier: ${value}`);
}
const DAY_MS = 86_400_000;
function timestamp(date: Date): number {
  const value = date.getTime();
  if (!Number.isFinite(value)) throw new RangeError('Invalid date');
  return value;
}
function count(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Expected a non-negative integer');
  return value;
}
// UTC calendar months, clamping Jan 31 -> Apr 30 and Feb 29 -> Feb 28.
export function computeOnlineUntil({tier, firstPublishedAt, eventDate}: {tier: Tier; firstPublishedAt: Date; eventDate: Date}): Date {
  const end = new Date(timestamp(firstPublishedAt));
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + TIERS[tier].onlineMonths);
  const last = new Date(end.getTime());
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  end.setUTCDate(Math.min(day, last.getUTCDate()));
  return new Date(Math.max(end.getTime(), timestamp(eventDate) + TIERS[tier].graceDaysAfterEvent * DAY_MS));
}
export function remainingEdits({editsAllowed, editsUsed}: {editsAllowed: number; editsUsed: number}): number {
  return Math.max(0, count(editsAllowed) - count(editsUsed));
}
export function daysOnlineLeft({onlineUntil, now}: {onlineUntil: Date; now: Date}): number {
  return Math.max(0, Math.ceil((timestamp(onlineUntil) - timestamp(now)) / DAY_MS));
}
export function canPublish({editsAllowed, editsUsed, onlineUntil, now}: {editsAllowed: number; editsUsed: number; onlineUntil: Date; now: Date}): {ok: true} | {ok: false; reason: 'no_edits_left' | 'expired'} {
  const expired = timestamp(now) >= timestamp(onlineUntil);
  if (remainingEdits({editsAllowed, editsUsed}) === 0) return {ok: false, reason: 'no_edits_left'};
  if (expired) return {ok: false, reason: 'expired'};
  return {ok: true};
}
