import {afterEach, describe, expect, it, vi} from 'vitest';

vi.mock('next/headers', () => ({cookies: async () => ({getAll: () => [], set: () => undefined})}));

import {isAuthConfigured} from './config';
import {mapAuthError} from './errors';
import {getServerSession, sessionFromClient, type SessionSource} from './session';

function client(user: unknown, error: unknown, token?: string): SessionSource {
  return {
    auth: {
      getUser: async () => ({data: {user: user as never}, error}),
      getSession: async () => ({data: {session: token ? {access_token: token} : null}})
    }
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('sessionFromClient', () => {
  it('maps a valid user and token', async () => {
    const session = await sessionFromClient(client({id: 'u1', email: 'a@b.co', phone: ''}, null, 'jwt'));
    expect(session).toEqual({accessToken: 'jwt', userId: 'u1', email: 'a@b.co'});
  });

  it('includes phone when present', async () => {
    expect(await sessionFromClient(client({id: 'u2', phone: '2010'}, null, 'jwt'))).toEqual({accessToken: 'jwt', userId: 'u2', phone: '2010'});
  });

  it('returns null without a user', async () => {
    expect(await sessionFromClient(client(null, null, 'jwt'))).toBeNull();
  });

  it('returns null on getUser error even with a token', async () => {
    expect(await sessionFromClient(client({id: 'u1'}, new Error('jwt expired'), 'jwt'))).toBeNull();
  });

  it('returns null without an access token', async () => {
    expect(await sessionFromClient(client({id: 'u1'}, null))).toBeNull();
  });

  it('returns null when the client throws', async () => {
    const broken: SessionSource = {auth: {getUser: async () => { throw new Error('network'); }, getSession: async () => ({data: {session: null}})}};
    expect(await sessionFromClient(broken)).toBeNull();
  });
});

describe('unconfigured environment', () => {
  it('reports not configured and returns a null session', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    expect(isAuthConfigured()).toBe(false);
    expect(await getServerSession()).toBeNull();
  });

  it('reports configured when both vars are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    expect(isAuthConfigured()).toBe(true);
  });
});

describe('mapAuthError', () => {
  it('maps known failures', () => {
    expect(mapAuthError({status: 429}, 'send')).toBe('tooMany');
    expect(mapAuthError({code: 'over_email_send_rate_limit'}, 'send')).toBe('tooMany');
    expect(mapAuthError({code: 'email_address_invalid'}, 'send')).toBe('invalidEmail');
    expect(mapAuthError({code: 'otp_expired', status: 403}, 'verify')).toBe('invalidCode');
    expect(mapAuthError({status: 500}, 'verify')).toBe('generic');
    expect(mapAuthError(null, 'send')).toBe('generic');
  });
});
