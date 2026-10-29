/** Name of the cookie a partner link sets (`/ar/r/<code>`): `<code>.<unix seconds of the click>`. */
export const REF_COOKIE = 'ref';
export const FRIEND_COOKIE = 'friend';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CODE = /^[a-z0-9_-]{3,32}$/;
export const FRIEND_CODE = /^f-[a-hj-np-z2-9]{8}$/;

export function parseFriendCookie(value: string | undefined): string | undefined {
  return value && FRIEND_CODE.test(value) ? value : undefined;
}

/** The partner a buyer arrived through, or undefined when the cookie is missing, malformed, from the future or older than 30 days. */
export function parseRefCookie(value: string | undefined, now: Date = new Date()): {code: string; at: string} | undefined {
  if (value === undefined) return undefined;
  const match = /^([a-z0-9_-]{3,32})\.(\d{9,11})$/.exec(value);
  if (!match?.[1] || !match[2] || !CODE.test(match[1])) return undefined;
  const at = Number(match[2]) * 1000;
  if (at > now.getTime() + 5 * 60 * 1000 || at < now.getTime() - THIRTY_DAYS_MS) return undefined;
  return {code: match[1], at: new Date(at).toISOString()};
}
