const LOCALES = ['ar', 'en'];

export function defaultNextPath(locale: string): string {
  return `/${LOCALES.includes(locale) ? locale : 'ar'}/app`;
}

/** Only same-origin relative paths are allowed as post-login destinations. */
export function safeNextPath(next: string | null | undefined, locale: string): string {
  const fallback = defaultNextPath(locale);
  if (typeof next !== 'string' || next.length === 0 || next.length > 2048) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  // Backslashes and control characters are normalised to '/' or stripped by browsers.
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const parsed = new URL(next, 'http://safe.invalid');
    if (parsed.origin !== 'http://safe.invalid') return fallback;
  } catch {
    return fallback;
  }
  return next;
}

/** Locale implied by a safe path's first segment, if any. */
export function localeOfPath(path: string): string | null {
  const first = path.split('/')[1];
  return first && LOCALES.includes(first) ? first : null;
}
