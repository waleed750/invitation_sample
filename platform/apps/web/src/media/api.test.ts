import {describe, expect, it} from 'vitest';
import {errorCode} from './api';

describe('errorCode', () => {
  it('reads the API error envelope, a bare code, and falls back to generic', () => {
    expect(errorCode({error: {code: 'quota_exceeded', message: 'x', requestId: 'r'}})).toBe('quota_exceeded');
    expect(errorCode({code: 'file_too_large'})).toBe('file_too_large');
    expect(errorCode({error: {}})).toBe('generic');
    expect(errorCode(null)).toBe('generic');
    expect(errorCode('oops')).toBe('generic');
  });
});
