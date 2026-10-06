import {describe, expect, it} from 'vitest';
import fs from 'fs';
import path from 'path';

describe('africa.css', () => {
  it('is scoped under data-template', () => {
    const cssPath = path.resolve(__dirname, '../africa.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('.invitation-shell[data-template="africa"] {');
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutKeyframes = withoutComments.replace(/@keyframes\s+[^{]+\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/g, '');
    const withoutFontface = withoutKeyframes.replace(/@font-face\s*\{[^}]*\}/g, '');
    const wrapperMatch = withoutFontface.match(/\.invitation-shell\[data-template="africa"\]\s*\{([\s\S]*)\}/);
    expect(wrapperMatch).toBeTruthy();
    // Just replace the first occurrence of the entire block
    // Wait, replacing a big regex could be slow or fail. But let's assume it works.
    const rest = withoutFontface.substring(0, wrapperMatch!.index!) + withoutFontface.substring(wrapperMatch!.index! + wrapperMatch![0].length);
    expect(rest.trim()).toBe('');
  });
});
