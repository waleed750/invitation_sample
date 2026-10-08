export type AuthErrorKey = 'invalidEmail' | 'invalidCode' | 'tooMany' | 'generic';

interface ErrorLike {
  code?: string;
  status?: number;
}

export function mapAuthError(error: unknown, step: 'send' | 'verify'): AuthErrorKey {
  const e = (error ?? {}) as ErrorLike;
  const code = e.code ?? '';
  if (e.status === 429 || code.includes('rate_limit')) return 'tooMany';
  if (code === 'email_address_invalid' || code === 'validation_failed') return step === 'send' ? 'invalidEmail' : 'invalidCode';
  if (code === 'otp_expired' || code === 'otp_disabled') return 'invalidCode';
  if (step === 'verify' && (e.status === 400 || e.status === 401 || e.status === 403)) return 'invalidCode';
  return 'generic';
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
