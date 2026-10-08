import {describe, expect, it} from 'vitest';
import {localeOfPath, safeNextPath} from './safe-next';

describe('safeNextPath', () => {
  it('keeps same-origin relative paths', () => {
    expect(safeNextPath('/ar/app/orders', 'ar')).toBe('/ar/app/orders');
    expect(safeNextPath('/en/app?tab=1#x', 'en')).toBe('/en/app?tab=1#x');
    expect(safeNextPath('/', 'ar')).toBe('/');
  });

  it.each([
    ['//evil.com', 'protocol-relative'],
    ['///evil.com', 'triple slash'],
    ['/\\evil.com', 'slash backslash'],
    ['\\\\evil.com', 'backslashes'],
    ['/ar/app\\..\\x', 'embedded backslash'],
    ['https://evil.com', 'absolute https'],
    ['http://evil.com/ar/app', 'absolute http'],
    ['javascript:alert(1)', 'javascript'],
    ['data:text/html,x', 'data'],
    ['ar/app', 'no leading slash'],
    ['', 'empty'],
    ['/\t/evil.com', 'tab'],
    ['/\n/evil.com', 'newline'],
    ['/\r/evil.com', 'carriage return'],
    [' //evil.com', 'leading space'],
    ['/' + 'a'.repeat(3000), 'too long']
  ])('rejects %s (%s)', (input) => {
    expect(safeNextPath(input, 'ar')).toBe('/ar/app');
  });

  it('falls back for null, undefined and unknown locale', () => {
    expect(safeNextPath(null, 'en')).toBe('/en/app');
    expect(safeNextPath(undefined, 'ar')).toBe('/ar/app');
    expect(safeNextPath('//x', 'fr')).toBe('/ar/app');
  });
});

describe('localeOfPath', () => {
  it('reads the locale segment', () => {
    expect(localeOfPath('/en/app')).toBe('en');
    expect(localeOfPath('/fr/app')).toBeNull();
    expect(localeOfPath('/')).toBeNull();
  });
});
