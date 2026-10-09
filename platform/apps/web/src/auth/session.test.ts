import {afterEach, describe, expect, it, vi} from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [{name: 'auth.session', value: 'fake-cookie'}],
    set: () => undefined
  })
}));

import {getServerSession} from './session';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('getServerSession', () => {
  it('fetches session from the API and maps it', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {id: 'u1', email: 'a@b.co', phoneNumber: ''},
        session: {token: 'jwt-token'}
      })
    });
    
    const session = await getServerSession();
    expect(session).toEqual({accessToken: 'jwt-token', userId: 'u1', email: 'a@b.co'});
    expect(fetch).toHaveBeenCalledWith('http://api/v1/auth/get-session', expect.any(Object));
  });

  it('includes phone when present', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {id: 'u2', phoneNumber: '2010'},
        session: {token: 'jwt-token'}
      })
    });
    
    expect(await getServerSession()).toEqual({accessToken: 'jwt-token', userId: 'u2', phone: '2010'});
  });

  it('returns null on non-200', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api');
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    expect(await getServerSession()).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api');
    global.fetch = vi.fn().mockRejectedValue(new Error('network'));
    expect(await getServerSession()).toBeNull();
  });
});
