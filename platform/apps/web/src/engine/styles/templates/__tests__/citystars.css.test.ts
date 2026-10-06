import {describe, expect, it} from 'vitest';
import fs from 'fs';
import path from 'path';

describe('citystars.css', () => {
  it('is scoped under data-template', () => {
    const cssPath = path.resolve(__dirname, '../citystars.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('.invitation-shell[data-template="citystars"] {');
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutKeyframes = withoutComments.replace(/@keyframes\s+[^{]+\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/g, '');
    const withoutFontface = withoutKeyframes.replace(/@font-face\s*\{[^}]*\}/g, '');
    const wrapperMatch = withoutFontface.match(/\.invitation-shell\[data-template="citystars"\]\s*\{([\s\S]*)\}/);
    expect(wrapperMatch).toBeTruthy();
    const rest = withoutFontface.substring(0, wrapperMatch!.index!) + withoutFontface.substring(wrapperMatch!.index! + wrapperMatch![0].length);
    expect(rest.trim()).toBe('');
  });
});
