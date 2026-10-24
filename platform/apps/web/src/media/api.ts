/** Browser-side client for the media endpoints. Calls go straight to the API with the sign-in cookie (files can be large). */

export interface MediaItem {
  id: string;
  kind: 'image' | 'video' | 'audio' | null;
  status: 'processing' | 'ready' | 'rejected';
  reason: string | null;
  url: string | null;
  variants: {width: number; url: string}[];
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  originalName: string | null;
  invitationId: string | null;
  createdAt: string;
}

export interface MediaUsage {
  count: number;
  maxCount: number;
  bytes: number;
  tier: 'save-the-date' | 'classic' | 'premium';
  maxBytes: {image: number; video: number; audio: number};
}

export interface MediaList {
  items: MediaItem[];
  usage: MediaUsage;
}

/** Error with the API's machine code (`quota_exceeded`, `file_too_large`...) or `network`. */
export class MediaApiError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = 'MediaApiError';
  }
}

function base(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
}

/** The API wraps errors as `{error: {code, message, requestId}}`; accept a bare `{code}` too. */
export function errorCode(body: unknown): string {
  if (typeof body !== 'object' || body === null) return 'generic';
  const record = body as {code?: unknown; error?: {code?: unknown} | null};
  if (typeof record.error?.code === 'string') return record.error.code;
  return typeof record.code === 'string' ? record.code : 'generic';
}

async function failure(response: Response): Promise<MediaApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // not JSON
  }
  return new MediaApiError(errorCode(body), response.status);
}

export async function listMedia(): Promise<MediaList> {
  let response: Response;
  try {
    response = await fetch(`${base()}/v1/media`, {credentials: 'include', cache: 'no-store'});
  } catch {
    throw new MediaApiError('network', 0);
  }
  if (!response.ok) throw await failure(response);
  return (await response.json()) as MediaList;
}

export function uploadMedia(file: File, options: {invitationId?: string; onProgress?: (percent: number) => void} = {}): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    if (options.invitationId) form.append('invitationId', options.invitationId); // must precede the file
    form.append('file', file);
    const request = new XMLHttpRequest();
    request.open('POST', `${base()}/v1/media`);
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new MediaApiError('network', 0));
    request.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(request.responseText) as unknown;
      } catch {
        // not JSON
      }
      if (request.status >= 200 && request.status < 300) {
        resolve(body as MediaItem);
        return;
      }
      reject(new MediaApiError(errorCode(body), request.status));
    };
    request.send(form);
  });
}

export async function deleteMedia(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${base()}/v1/media/${encodeURIComponent(id)}`, {method: 'DELETE', credentials: 'include'});
  } catch {
    throw new MediaApiError('network', 0);
  }
  if (!response.ok) throw await failure(response);
}
