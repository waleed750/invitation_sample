import {randomUUID} from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

interface WithRequestId extends IncomingMessage {
  requestId?: string;
}

/**
 * The single source of the request id. Reuses an incoming `x-request-id` (so
 * callers can trace their own calls) or generates one, caches it on the
 * request and echoes it on the response. Both pino-http (`genReqId`) and
 * `RequestIdMiddleware` call this, so whichever runs first wins and both agree.
 */
export function resolveRequestId(req: IncomingMessage, res?: ServerResponse): string {
  const request = req as WithRequestId;
  if (request.requestId === undefined) {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    request.requestId = candidate !== undefined && candidate.trim() !== '' ? candidate.trim() : randomUUID();
  }
  if (res !== undefined && !res.headersSent) res.setHeader(REQUEST_ID_HEADER, request.requestId);
  return request.requestId;
}
