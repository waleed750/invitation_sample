import {createHmac, timingSafeEqual} from 'node:crypto';

export interface RevalidateSignatureInput {
  /** Exact raw request body text (must not be re-serialized). */
  rawBody: string;
  /** Value of the `x-signature` header, or null when absent. */
  signatureHeader: string | null;
  /** Shared secret (expected to be at least 32 chars; enforced by the route). */
  secret: string;
}

function isHex(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/u.test(value);
}

/**
 * Verifies `x-signature` = hex(HMAC-SHA256(raw body, secret)) using a
 * constant-time comparison. Never throws and never logs its inputs.
 */
export function verifyRevalidateSignature({rawBody, signatureHeader, secret}: RevalidateSignatureInput): boolean {
  try {
    if (typeof signatureHeader !== 'string' || !isHex(signatureHeader)) return false;
    const received = Buffer.from(signatureHeader, 'hex');
    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
    if (received.length !== expected.length) return false;
    return timingSafeEqual(received, expected);
  } catch {
    return false;
  }
}
