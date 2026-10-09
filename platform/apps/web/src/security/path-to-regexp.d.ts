// Next bundles path-to-regexp without types; the headers test uses it to match `headers()` sources.
declare module 'next/dist/compiled/path-to-regexp' {
  export function pathToRegexp(source: string): RegExp;
}
