import {describe, expect, it} from 'vitest';
import {isFrameMessage, isParentMessage} from './protocol';

describe('editor postMessage protocol', () => {
  it('accepts well-formed parent messages only', () => {
    expect(isParentMessage({type: 'editor:doc', document: {}, locale: 'ar'})).toBe(true);
    expect(isParentMessage({type: 'editor:focus', index: 2})).toBe(true);
    for (const bad of [null, 'x', {type: 'editor:doc'}, {type: 'editor:doc', document: {}, locale: 'fr'}, {type: 'editor:focus', index: -1}, {type: 'editor:focus', index: 1.5}, {type: 'other'}]) {
      expect(isParentMessage(bad)).toBe(false);
    }
  });
  it('recognises the ready message', () => {
    expect(isFrameMessage({type: 'editor:frame-ready'})).toBe(true);
    expect(isFrameMessage({type: 'editor:doc'})).toBe(false);
  });
});
