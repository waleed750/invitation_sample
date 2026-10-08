import {describe, expect, it} from 'vitest';
import {ApiInvitationPublicStore, ApiStoreError, getPublicState} from './api-store';

const BASE_URL = 'https://api.example.com';

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function createFakeFetch(handler: (captured: CapturedRequest) => {status: number; payload: unknown}) {
  const calls: CapturedRequest[] = [];
  const fetch = async (input: unknown, init?: RequestInit): Promise<Response> => {
    let url: string;
    let method: string;
    let headers: Headers;
    let rawBody: string | null = null;
    if (typeof input === 'object' && input !== null && 'url' in input && typeof (input as Request).text === 'function') {
      const request = input as Request;
      url = request.url;
      method = request.method;
      headers = new Headers(request.headers);
      rawBody = await request.text();
    } else {
      url = String(input);
      method = init?.method ?? 'GET';
      headers = new Headers(init?.headers as HeadersInit | undefined);
      const bodyInit = init?.body;
      rawBody = typeof bodyInit === 'string' ? bodyInit : null;
    }
    const headerRecord: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerRecord[key] = value;
    });
    const captured: CapturedRequest = {url, method, headers: headerRecord, body: rawBody ? JSON.parse(rawBody) as unknown : undefined};
    calls.push(captured);
    const {status, payload} = handler(captured);
    return new Response(JSON.stringify(payload), {status, headers: {'content-type': 'application/json'}});
  };
  return {calls, fetch: fetch as typeof fetch};
}

const LIVE_PAYLOAD = {
  state: 'live',
  slug: 'ahmed-mona',
  tier: 'classic',
  locale: 'ar',
  snapshot: {
    data: {
      templateSlug: 'mashrabiya',
      couple: {firstName: 'Ahmed', secondName: 'Mona'},
      event: {date: '2026-06-20'},
    },
  },
  publishedAt: '2026-01-01T00:00:00.000Z',
  onlineUntil: '2026-12-31T00:00:00.000Z',
};

const ENDED_PAYLOAD = {state: 'ended', couple: {first: 'Ahmed', second: 'Mona'}, eventDate: '2026-06-20'};

const INVITATION_ID = '11111111-1111-1111-8111-111111111111';

function apiError(code: string) {
  return {error: {code, message: code, requestId: 'req-1'}};
}

describe('ApiInvitationPublicStore', () => {
  it('fetches and maps a live invitation', async () => {
    const {calls, fetch} = createFakeFetch(() => ({status: 200, payload: LIVE_PAYLOAD}));
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
    await expect(store.getBySlug('ahmed-mona')).resolves.toEqual({
      shareSlug: 'ahmed-mona',
      templateSlug: 'mashrabiya',
      tier: 'classic',
      couple: {first: 'Ahmed', second: 'Mona'},
      eventDate: '2026-06-20',
      publishedAt: '2026-01-01T00:00:00.000Z',
      onlineUntil: '2026-12-31T00:00:00.000Z',
      locale: 'ar',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${BASE_URL}/v1/public/invitations/ahmed-mona`);
    expect(calls[0]?.method).toBe('GET');
    expect(calls[0]?.headers.authorization).toBeUndefined();
  });

  it('normalizes db tiers and null onlineUntil', async () => {
    const payload = {...LIVE_PAYLOAD, tier: 'save_the_date', onlineUntil: null};
    const {fetch} = createFakeFetch(() => ({status: 200, payload}));
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
    const snapshot = await store.getBySlug('ahmed-mona');
    expect(snapshot?.tier).toBe('save-the-date');
    expect(snapshot?.onlineUntil).toBe('9999-12-31T00:00:00.000Z');
  });

  it('returns null for ended and missing invitations', async () => {
    const ended = createFakeFetch(() => ({status: 200, payload: ENDED_PAYLOAD}));
    const endedStore = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch: ended.fetch, getAccessToken: () => null});
    await expect(endedStore.getBySlug('ahmed-mona')).resolves.toBeNull();

    const missing = createFakeFetch(() => ({status: 404, payload: apiError('invitation_not_found')}));
    const missingStore = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch: missing.fetch, getAccessToken: () => null});
    await expect(missingStore.getBySlug('nope')).resolves.toBeNull();
  });

  it('exposes live / ended / missing state', async () => {
    const live = createFakeFetch(() => ({status: 200, payload: LIVE_PAYLOAD}));
    await expect(getPublicState('ahmed-mona', {baseUrl: BASE_URL, fetch: live.fetch})).resolves.toBe('live');
    const ended = createFakeFetch(() => ({status: 200, payload: ENDED_PAYLOAD}));
    await expect(getPublicState('ahmed-mona', {baseUrl: BASE_URL, fetch: ended.fetch})).resolves.toBe('ended');
    const missing = createFakeFetch(() => ({status: 404, payload: apiError('invitation_not_found')}));
    await expect(getPublicState('nope', {baseUrl: BASE_URL, fetch: missing.fetch})).resolves.toBe('missing');
  });

  it('posts RSVPs with the honeypot sent empty', async () => {
    const {calls, fetch} = createFakeFetch(() => ({status: 201, payload: {ok: true}}));
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
    await store.addRsvp('ahmed-mona', {
      id: 'rsvp-1', name: 'Guest', phone: '+201012345678', attending: true, guests: 2, note: 'Hello', createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${BASE_URL}/v1/public/invitations/ahmed-mona/rsvp`);
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual({
      name: 'Guest', phone: '+201012345678', attending: true, guests: 2, note: 'Hello', website: '',
    });
  });

  it('posts messages with the honeypot sent empty', async () => {
    const {calls, fetch} = createFakeFetch(() => ({status: 201, payload: {ok: true}}));
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
    await store.addMessage('ahmed-mona', {id: 'm-1', name: 'Guest', text: 'Congrats', createdAt: '2026-01-01T00:00:00.000Z'});
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${BASE_URL}/v1/public/invitations/ahmed-mona/messages`);
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual({name: 'Guest', text: 'Congrats', website: ''});
  });

  it('maps API error codes to action codes', async () => {
    const cases: Array<[string, number, string]> = [
      ['rsvp_disabled', 403, 'not_allowed'],
      ['rsvp_limit_reached', 403, 'limit_reached'],
      ['messages_disabled', 403, 'not_allowed'],
      ['invitation_ended', 410, 'expired'],
      ['invitation_not_found', 404, 'unknown_invitation'],
      ['invalid_phone', 400, 'invalid'],
    ];
    for (const [apiCode, status, actionCode] of cases) {
      const {fetch} = createFakeFetch(() => ({status, payload: apiError(apiCode)}));
      const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
      const failure = await store.addRsvp('ahmed-mona', {
        id: 'r', name: 'G', attending: true, guests: 1, createdAt: '2026-01-01T00:00:00.000Z',
      }).then(() => null, (error: unknown) => error);
      expect(failure).toBeInstanceOf(ApiStoreError);
      expect((failure as ApiStoreError).actionCode).toBe(actionCode);
    }
    const throttled = createFakeFetch(() => ({status: 429, payload: apiError('throttled')}));
    const throttledStore = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch: throttled.fetch, getAccessToken: () => null});
    await expect(throttledStore.addMessage('ahmed-mona', {id: 'm', name: 'G', text: 'Hi', createdAt: '2026-01-01T00:00:00.000Z'}))
      .rejects.toMatchObject({actionCode: 'rate_limited'});
    const broken = createFakeFetch(() => ({status: 500, payload: apiError('internal_error')}));
    const brokenStore = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch: broken.fetch, getAccessToken: () => null});
    await expect(brokenStore.getBySlug('ahmed-mona')).rejects.toMatchObject({actionCode: 'storage_error'});
  });

  it('publish is a no-op', async () => {
    const {calls, fetch} = createFakeFetch(() => { throw new Error('must not fetch'); });
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
    await expect(store.publish({
      shareSlug: 'a', templateSlug: 'mashrabiya', tier: 'classic', couple: {first: 'A', second: 'B'},
      eventDate: '2026-06-20', publishedAt: '2026-01-01T00:00:00.000Z', onlineUntil: '2026-12-31T00:00:00.000Z', locale: 'ar',
    })).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('returns [] for owner lists when signed out, without any request', async () => {
    const {calls, fetch} = createFakeFetch(() => ({status: 200, payload: []}));
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: () => null});
    await expect(store.listRsvps('ahmed-mona')).resolves.toEqual([]);
    await expect(store.listMessages('ahmed-mona')).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('resolves slug to id, then lists RSVPs with the bearer token', async () => {
    const {calls, fetch} = createFakeFetch((captured) => {
      if (captured.url === `${BASE_URL}/v1/invitations`) {
        return {status: 200, payload: [{id: INVITATION_ID, shareSlug: 'ahmed-mona'}]};
      }
      return {status: 200, payload: [
        {id: 'r1', name: 'Guest', phone: '+201012345678', attending: true, guests: 2, note: null, createdAt: '2026-01-01T00:00:00.000Z'},
        {id: 'r2', name: 'Other', phone: null, attending: false, guests: 1, note: 'Hi', createdAt: '2026-01-02T00:00:00.000Z'},
      ]};
    });
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: async () => 'token-123'});
    await expect(store.listRsvps('ahmed-mona')).resolves.toEqual([
      {id: 'r1', name: 'Guest', phone: '+201012345678', attending: true, guests: 2, createdAt: '2026-01-01T00:00:00.000Z'},
      {id: 'r2', name: 'Other', attending: false, guests: 1, note: 'Hi', createdAt: '2026-01-02T00:00:00.000Z'},
    ]);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.url).toBe(`${BASE_URL}/v1/invitations`);
    expect(calls[0]?.headers.authorization).toBe('Bearer token-123');
    expect(calls[1]?.url).toBe(`${BASE_URL}/v1/invitations/${INVITATION_ID}/rsvps`);
    expect(calls[1]?.headers.authorization).toBe('Bearer token-123');
  });

  it('returns [] when the slug belongs to nobody the caller owns', async () => {
    const {calls, fetch} = createFakeFetch((captured) => {
      if (captured.url === `${BASE_URL}/v1/invitations`) {
        return {status: 200, payload: [{id: INVITATION_ID, shareSlug: 'someone-else'}]};
      }
      throw new Error('must not request owner lists');
    });
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: async () => 'token-123'});
    await expect(store.listRsvps('ahmed-mona')).resolves.toEqual([]);
    await expect(store.listMessages('ahmed-mona')).resolves.toEqual([]);
    expect(calls).toHaveLength(2);
  });

  it('lists owner messages with slug to id resolution', async () => {
    const {calls, fetch} = createFakeFetch((captured) => {
      if (captured.url === `${BASE_URL}/v1/invitations`) {
        return {status: 200, payload: [{id: INVITATION_ID, shareSlug: 'ahmed-mona'}]};
      }
      return {status: 200, payload: [{id: 'm1', name: 'Guest', text: 'Congrats', createdAt: '2026-01-01T00:00:00.000Z'}]};
    });
    const store = new ApiInvitationPublicStore({baseUrl: BASE_URL, fetch, getAccessToken: async () => 'token-123'});
    await expect(store.listMessages('ahmed-mona')).resolves.toEqual([
      {id: 'm1', name: 'Guest', text: 'Congrats', createdAt: '2026-01-01T00:00:00.000Z'},
    ]);
    expect(calls[1]?.url).toBe(`${BASE_URL}/v1/invitations/${INVITATION_ID}/messages`);
  });
});
