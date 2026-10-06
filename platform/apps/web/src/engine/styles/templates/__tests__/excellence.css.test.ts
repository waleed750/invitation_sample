import {describe, expect, it} from 'vitest';
import fs from 'fs';
import path from 'path';

describe('excellence.css', () => {
  it('is scoped under data-template', () => {
    const cssPath = path.resolve(__dirname, '../excellence.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('.invitation-shell[data-template="excellence"] {');
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutKeyframes = withoutComments.replace(/@keyframes\s+[^{]+\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/g, '');
    const withoutFontface = withoutKeyframes.replace(/@font-face\s*\{[^}]*\}/g, '');
    const wrapperMatch = withoutFontface.match(/\.invitation-shell\[data-template="excellence"\]\s*\{([\s\S]*)\}/);
    expect(wrapperMatch).toBeTruthy();
    const rest = withoutFontface.substring(0, wrapperMatch!.index!) + withoutFontface.substring(wrapperMatch!.index! + wrapperMatch![0].length);
    expect(rest.trim()).toBe('');
  });
});
