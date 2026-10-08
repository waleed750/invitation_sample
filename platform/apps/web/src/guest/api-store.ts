import {createApiClient, type ApiClient} from '@platform/api-client';
import {z} from 'zod';
import {getServerSession} from '../auth/session';
import type {GuestMessage, InvitationPublicStore, PublishedSnapshot, Rsvp} from './store';
import type {GuestActionCode} from './submissions';

/** Failure codes the store can surface; matches the submission result style. */
export type ApiStoreActionCode = Exclude<GuestActionCode, 'submitted' | 'accepted'>;

/** Thrown by {@link ApiInvitationPublicStore} with an action-style code. */
export class ApiStoreError extends Error {
  readonly actionCode: ApiStoreActionCode;

  constructor(actionCode: ApiStoreActionCode, message?: string) {
    super(message ?? actionCode);
    this.name = 'ApiStoreError';
    this.actionCode = actionCode;
  }
}

export type PublicInvitationState = 'live' | 'ended' | 'missing';

export interface ApiStoreDeps {
  baseUrl?: string;
  fetch?: typeof fetch;
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
}

async function defaultGetAccessToken(): Promise<string | null> {
  try {
    return (await getServerSession())?.accessToken ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, key: string): string | null {
  return isRecord(value) && typeof value[key] === 'string' ? (value[key] as string) : null;
}

function pickText(value: unknown, locale: 'ar' | 'en'): string {
  if (typeof value === 'string') return value;
  if (isRecord(value)) {
    for (const key of [locale, 'ar', 'en'] as const) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate !== '') return candidate;
    }
  }
  return '';
}

const liveInvitationSchema = z.object({
  state: z.literal('live'),
  slug: z.string(),
  tier: z.unknown(),
  locale: z.unknown(),
  snapshot: z.unknown(),
  publishedAt: z.string(),
  onlineUntil: z.string().nullable(),
});

const publicInvitationSchema = z.discriminatedUnion('state', [
  z.object({state: z.literal('ended')}),
  liveInvitationSchema,
]);

type LiveInvitation = z.infer<typeof liveInvitationSchema>;

const tierSchema = z.enum(['save-the-date', 'classic', 'premium']);

/** The API speaks DB tiers (`save_the_date`); the web speaks `save-the-date`. */
function normalizeTier(value: unknown): PublishedSnapshot['tier'] | null {
  if (value === 'save_the_date') return 'save-the-date';
  const parsed = tierSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function extractCouple(data: unknown, locale: 'ar' | 'en'): {first: string; second: string} {
  const root = isRecord(data) ? data : {};
  const couple = isRecord(root.couple) ? root.couple : {};
  return {
    first: pickText(couple.firstName ?? couple.first ?? root.firstName, locale),
    second: pickText(couple.secondName ?? couple.second ?? root.secondName, locale),
  };
}

function extractEventDate(data: unknown, locale: 'ar' | 'en'): string {
  const root = isRecord(data) ? data : {};
  const event = isRecord(root.event) ? root.event : {};
  for (const candidate of [event.date, event.displayDate, root.eventDate, root.event_date]) {
    if (typeof candidate === 'string' && candidate !== '') return candidate;
    const text = pickText(candidate, locale);
    if (text !== '') return text;
  }
  return '';
}

function extractTemplateSlug(data: unknown): string {
  const root = isRecord(data) ? data : {};
  return stringField(root, 'templateSlug')
    ?? (isRecord(root.template) ? stringField(root.template, 'slug') : null)
    ?? '';
}

/**
 * Maps a live API response onto the web snapshot. Returns null when the
 * response is well-formed but carries no usable tier/locale — the page then
 * treats the invitation as unknown, same as a missing demo entry.
 *
 * API gap: `GET /v1/public/invitations/:slug` does not return the template
 * slug, so `templateSlug` is best-effort (empty when the snapshot `data`
 * carries none) and the page 404s until the API includes it.
 */
function toSnapshot(shareSlug: string, live: LiveInvitation): PublishedSnapshot | null {
  const tier = normalizeTier(live.tier);
  const locale = live.locale === 'ar' || live.locale === 'en' ? live.locale : null;
  if (tier === null || locale === null) return null;
  const data = isRecord(live.snapshot) && 'data' in live.snapshot ? live.snapshot.data : live.snapshot;
  return {
    shareSlug,
    templateSlug: extractTemplateSlug(data),
    tier,
    couple: extractCouple(data, locale),
    eventDate: extractEventDate(data, locale),
    publishedAt: live.publishedAt,
    onlineUntil: live.onlineUntil ?? '9999-12-31T00:00:00.000Z',
    locale,
  };
}

const apiErrorSchema = z.object({error: z.object({code: z.string()})});

function mapApiCode(apiCode: string | undefined, status: number): ApiStoreActionCode {
  switch (apiCode) {
    case 'rsvp_disabled':
    case 'messages_disabled':
      return 'not_allowed';
    case 'rsvp_limit_reached':
      return 'limit_reached';
    case 'invitation_ended':
      return 'expired';
    case 'invitation_not_found':
      return 'unknown_invitation';
    case 'invalid_phone':
      return 'invalid';
    default:
      break;
  }
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'invalid';
  if (status === 404) return 'unknown_invitation';
  if (status === 403) return 'not_allowed';
  if (status === 410) return 'expired';
  return 'storage_error';
}

function throwApiError(status: number, payload: unknown): never {
  const parsed = apiErrorSchema.safeParse(payload);
  const apiCode = parsed.success ? parsed.data.error.code : undefined;
  throw new ApiStoreError(mapApiCode(apiCode, status), apiCode ?? `http_${status}`);
}

const invitationListSchema = z.array(z.object({id: z.string(), shareSlug: z.string()}));

const ownerRsvpSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  attending: z.boolean(),
  guests: z.number(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

const ownerMessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  text: z.string(),
  createdAt: z.string(),
});

const ackSchema = z.object({ok: z.literal(true)});

export function createGuestApiClient(deps: ApiStoreDeps = {}): ApiClient {
  const baseUrl = deps.baseUrl ?? process.env.API_BASE_URL ?? '';
  if (!baseUrl) throw new Error('API_BASE_URL is not configured (required for GUEST_MODE=api)');
  return createApiClient({
    baseUrl,
    ...(deps.fetch ? {fetch: deps.fetch} : {}),
    getAccessToken: deps.getAccessToken ?? defaultGetAccessToken,
  });
}

export class ApiInvitationPublicStore implements InvitationPublicStore {
  private readonly client: ApiClient;
  private readonly getAccessToken: NonNullable<ApiStoreDeps['getAccessToken']>;

  constructor(deps: ApiStoreDeps = {}) {
    this.client = createGuestApiClient(deps);
    this.getAccessToken = deps.getAccessToken ?? defaultGetAccessToken;
  }

  async publish(_snapshot: PublishedSnapshot): Promise<void> {
    // No-op: in api mode publishing happens through the commerce client.
    void _snapshot;
  }

  async getBySlug(shareSlug: string): Promise<PublishedSnapshot | null> {
    const {data, response} = await this.getPublic(shareSlug);
    if (response.status === 404) return null;
    if (!response.ok) throwApiError(response.status, data);
    const parsed = publicInvitationSchema.safeParse(data);
    if (!parsed.success) throw new ApiStoreError('storage_error', 'Unexpected public invitation response');
    if (parsed.data.state === 'ended') return null;
    return toSnapshot(shareSlug, parsed.data);
  }

  async addRsvp(shareSlug: string, rsvp: Rsvp): Promise<void> {
    const body = {
      name: rsvp.name,
      attending: rsvp.attending,
      guests: rsvp.guests,
      website: '',
      ...(rsvp.phone !== undefined ? {phone: rsvp.phone} : {}),
      ...(rsvp.note !== undefined ? {note: rsvp.note} : {}),
    };
    let response: Response;
    let data: unknown;
    let error: unknown;
    try {
      const result = await this.client.POST('/v1/public/invitations/{slug}/rsvp', {
        params: {path: {slug: shareSlug}},
        body,
      });
      response = result.response;
      data = result.data as unknown;
      error = result.error as unknown;
    } catch {
      throw new ApiStoreError('storage_error', 'RSVP request failed');
    }
    if (!response.ok) throwApiError(response.status, error);
    if (!ackSchema.safeParse(data).success) {
      throw new ApiStoreError('storage_error', 'Unexpected RSVP response');
    }
  }

  async listRsvps(shareSlug: string): Promise<Rsvp[]> {
    const id = await this.resolveInvitationId(shareSlug);
    if (id === null) return [];
    let response: Response;
    let data: unknown;
    let error: unknown;
    try {
      const result = await this.client.GET('/v1/invitations/{id}/rsvps', {params: {path: {id}}});
      response = result.response;
      data = result.data as unknown;
      error = result.error as unknown;
    } catch {
      throw new ApiStoreError('storage_error', 'RSVP list request failed');
    }
    if (!response.ok) throwApiError(response.status, error);
    const parsed = z.array(ownerRsvpSchema).safeParse(data);
    if (!parsed.success) throw new ApiStoreError('storage_error', 'Unexpected RSVP list response');
    return parsed.data.map((row) => ({
      id: row.id,
      name: row.name,
      ...(row.phone !== null ? {phone: row.phone} : {}),
      attending: row.attending,
      guests: row.guests,
      ...(row.note !== null ? {note: row.note} : {}),
      createdAt: row.createdAt,
    }));
  }

  async addMessage(shareSlug: string, message: GuestMessage): Promise<void> {
    let response: Response;
    let data: unknown;
    let error: unknown;
    try {
      const result = await this.client.POST('/v1/public/invitations/{slug}/messages', {
        params: {path: {slug: shareSlug}},
        body: {name: message.name, text: message.text, website: ''},
      });
      response = result.response;
      data = result.data as unknown;
      error = result.error as unknown;
    } catch {
      throw new ApiStoreError('storage_error', 'Message request failed');
    }
    if (!response.ok) throwApiError(response.status, error);
    if (!ackSchema.safeParse(data).success) {
      throw new ApiStoreError('storage_error', 'Unexpected message response');
    }
  }

  async listMessages(shareSlug: string): Promise<GuestMessage[]> {
    const id = await this.resolveInvitationId(shareSlug);
    if (id === null) return [];
    let response: Response;
    let data: unknown;
    let error: unknown;
    try {
      const result = await this.client.GET('/v1/invitations/{id}/messages', {params: {path: {id}}});
      response = result.response;
      data = result.data as unknown;
      error = result.error as unknown;
    } catch {
      throw new ApiStoreError('storage_error', 'Message list request failed');
    }
    if (!response.ok) throwApiError(response.status, error);
    const parsed = z.array(ownerMessageSchema).safeParse(data);
    if (!parsed.success) throw new ApiStoreError('storage_error', 'Unexpected message list response');
    return parsed.data.map((row) => ({id: row.id, name: row.name, text: row.text, createdAt: row.createdAt}));
  }

  private async getPublic(shareSlug: string): Promise<{data: unknown; response: Response}> {
    try {
      const {data, response} = await this.client.GET('/v1/public/invitations/{slug}', {
        params: {path: {slug: shareSlug}},
      });
      return {data: data as unknown, response};
    } catch {
      throw new ApiStoreError('storage_error', 'Public invitation request failed');
    }
  }

  /** Resolves a share slug to the owner invitation id; null when signed out, not the owner, or auth fails. */
  private async resolveInvitationId(shareSlug: string): Promise<string | null> {
    let token: string | null | undefined;
    try {
      token = await this.getAccessToken();
    } catch {
      return null;
    }
    if (!token) return null;
    let data: unknown;
    let error: unknown;
    let response: Response;
    try {
      const result = await this.client.GET('/v1/invitations', {});
      data = result.data as unknown;
      error = result.error as unknown;
      response = result.response;
    } catch {
      throw new ApiStoreError('storage_error', 'Invitation lookup failed');
    }
    if (response.status === 401 || response.status === 403 || response.status === 404) return null;
    if (!response.ok) throwApiError(response.status, error);
    const parsed = invitationListSchema.safeParse(data);
    if (!parsed.success) throw new ApiStoreError('storage_error', 'Unexpected invitations response');
    return parsed.data.find((invitation) => invitation.shareSlug === shareSlug)?.id ?? null;
  }
}

/**
 * Public visibility state for a slug: `live`, `ended`, or `missing`.
 * The page uses it to render the ended page instead of a 404.
 */
export async function getPublicState(shareSlug: string, deps: ApiStoreDeps = {}): Promise<PublicInvitationState> {
  const client = createGuestApiClient(deps);
  let data: unknown;
  let response: Response;
  try {
    const result = await client.GET('/v1/public/invitations/{slug}', {params: {path: {slug: shareSlug}}});
    data = result.data as unknown;
    response = result.response;
  } catch {
    throw new ApiStoreError('storage_error', 'Public invitation request failed');
  }
  if (response.status === 404) return 'missing';
  if (!response.ok) throwApiError(response.status, data);
  const parsed = publicInvitationSchema.safeParse(data);
  if (!parsed.success) throw new ApiStoreError('storage_error', 'Unexpected public invitation response');
  return parsed.data.state;
}
