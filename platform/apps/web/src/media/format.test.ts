import {describe, expect, it} from 'vitest';
import {formatBytes} from './format';

describe('formatBytes', () => {
  it('formats sizes with binary units', () => {
    expect(formatBytes(0)).toBe('0 KB');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatBytes(50 * 1024 * 1024)).toBe('50 MB');
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    expect(formatBytes(Number.NaN)).toBe('0 KB');
  });
});
