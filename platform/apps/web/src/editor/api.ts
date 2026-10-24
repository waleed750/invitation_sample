import type {InvitationDocument} from '@platform/shared';

/** Browser calls for the editor (the sign-in cookie travels with them). */
export class EditorApiError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = 'EditorApiError';
  }
}

/** Set when the editor was opened through a private edit link: it then replaces the sign-in on every call. */
let editToken: string | null = null;
export function setEditToken(token: string | null): void {
  editToken = token;
}
export function inTokenMode(): boolean {
  return editToken !== null;
}

function base(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
}

function errorCode(body: unknown): string {
  const record = typeof body === 'object' && body !== null ? (body as {error?: {code?: unknown}}) : {};
  return typeof record.error?.code === 'string' ? record.error.code : 'generic';
}

async function request(method: 'PATCH' | 'POST', path: string, init: {body?: unknown; headers?: Record<string, string>}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${base()}${path}`, {
      method,
      credentials: editToken === null ? 'include' : 'omit',
      headers: {'content-type': 'application/json', ...(editToken === null ? {} : {'x-edit-token': editToken}), ...(init.headers ?? {})},
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new EditorApiError('network', 0);
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // empty body
  }
  if (!response.ok) throw new EditorApiError(errorCode(body), response.status);
  return body;
}

/** Autosave. `version` is the server's updatedAt, sent as If-Match (a stale one answers 409 `edit_conflict`). */
export async function saveDocument(id: string, document: InvitationDocument, version: string): Promise<{updatedAt: string}> {
  return (await request('PATCH', `/v1/invitations/${encodeURIComponent(id)}`, {body: {document}, headers: {'if-match': version}})) as {updatedAt: string};
}

export type PublishOutcome = {ok: true; slug: string; editsLeft: number} | {ok: false; reason: 'no_edits_left' | 'expired' | 'not_found'};

export async function publishInvitation(id: string): Promise<PublishOutcome> {
  const body = (await request('POST', `/v1/invitations/${encodeURIComponent(id)}/publish`, {body: {}})) as
    | {ok: true; invitation: {slug: string; entitlement: {remaining: number}}}
    | {ok: false; reason: 'no_edits_left' | 'expired' | 'not_found'};
  return body.ok ? {ok: true, slug: body.invitation.slug, editsLeft: body.invitation.entitlement.remaining} : body;
}
