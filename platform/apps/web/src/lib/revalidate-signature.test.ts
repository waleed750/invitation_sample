import {createHmac} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {verifyRevalidateSignature} from './revalidate-signature';

const SECRET = 's'.repeat(32);
const BODY = JSON.stringify({type: 'invitation', slug: 'ahmed-mona'});

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

describe('verifyRevalidateSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyRevalidateSignature({rawBody: BODY, signatureHeader: sign(BODY, SECRET), secret: SECRET})).toBe(true);
  });

  it('rejects a signature made with the wrong secret', () => {
    expect(verifyRevalidateSignature({rawBody: BODY, signatureHeader: sign(BODY, 'w'.repeat(32)), secret: SECRET})).toBe(false);
  });

  it('rejects a tampered body', () => {
    const tampered = JSON.stringify({type: 'invitation', slug: 'ahmed-evil'});
    expect(verifyRevalidateSignature({rawBody: tampered, signatureHeader: sign(BODY, SECRET), secret: SECRET})).toBe(false);
  });

  it('rejects malformed hex without throwing', () => {
    for (const bad of ['not-hex!!', 'abc', '', 'zz'.repeat(32)]) {
      expect(verifyRevalidateSignature({rawBody: BODY, signatureHeader: bad, secret: SECRET})).toBe(false);
    }
  });

  it('rejects a missing header without throwing', () => {
    expect(verifyRevalidateSignature({rawBody: BODY, signatureHeader: null, secret: SECRET})).toBe(false);
  });

  it('rejects a length mismatch without throwing', () => {
    const short = sign(BODY, SECRET).slice(0, 32);
    expect(verifyRevalidateSignature({rawBody: BODY, signatureHeader: short, secret: SECRET})).toBe(false);
  });
});
