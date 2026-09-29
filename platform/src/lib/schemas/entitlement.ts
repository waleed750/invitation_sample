export const TIERS = {
  'save-the-date': {price: 499, editsAllowed: 5, onlineMonths: 3, graceDaysAfterEvent: 7, templateSwitches: 1},
  classic: {price: 1299, editsAllowed: 15, onlineMonths: 6, graceDaysAfterEvent: 14, templateSwitches: 2},
  premium: {price: 2499, editsAllowed: 40, onlineMonths: 12, graceDaysAfterEvent: 30, templateSwitches: null}
} as const satisfies Record<string, {price: number; editsAllowed: number; onlineMonths: number; graceDaysAfterEvent: number; templateSwitches: number | null}>;
export type Tier = keyof typeof TIERS;
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
