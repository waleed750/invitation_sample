import {describe, it, expect} from 'vitest';
import {decideAdminAccess} from './guard';

describe('decideAdminAccess', () => {
  const baseAuthSession = {accessToken: 'token', userId: 'user-1'};
  const pathname = '/en/admin/payments';

  it('returns not-found if not configured', () => {
    expect(decideAdminAccess(false, true, null, undefined, 'en', pathname))
      .toEqual({action: 'not-found'});
  });

  it('returns not-found if not in API mode', () => {
    expect(decideAdminAccess(true, false, null, undefined, 'en', pathname))
      .toEqual({action: 'not-found'});
  });

  it('redirects to sign-in if no session', () => {
    const res = decideAdminAccess(true, true, null, undefined, 'en', pathname);
    expect(res.action).toBe('redirect');
    if (res.action === 'redirect') {
      expect(res.url).toBe('/en/sign-in?next=%2Fen%2Fadmin%2Fpayments');
    }
  });

  it('returns not-found if user role is not admin', () => {
    expect(decideAdminAccess(true, true, baseAuthSession, 'customer', 'en', pathname))
      .toEqual({action: 'not-found'});
    
    expect(decideAdminAccess(true, true, baseAuthSession, undefined, 'en', pathname))
      .toEqual({action: 'not-found'});
  });

  it('returns allow if user role is admin', () => {
    expect(decideAdminAccess(true, true, baseAuthSession, 'admin', 'en', pathname))
      .toEqual({action: 'allow'});
  });
});
