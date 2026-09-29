import {Injectable, type NestMiddleware} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {NextFunction, Request, Response} from 'express';
import {AppLogger} from './app-logger';
import {runWithRequestContext} from './request-context';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Reuses an incoming `x-request-id` (so callers can trace their own calls) or
 * generates one. The id is echoed on the response, stored on the request for
 * the exception filter, and installed as the logging context for the whole
 * request (see `AppLogger`). Only method/URL/status/duration are logged —
 * never headers, tokens, keys or bodies.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const requestId = candidate !== undefined && candidate.trim() !== '' ? candidate.trim() : randomUUID();
    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    runWithRequestContext({requestId}, () => {
      const startedAt = Date.now();
      res.on('finish', () => {
        this.logger.log(`${req.method} ${req.originalUrl} ${String(res.statusCode)} ${String(Date.now() - startedAt)}ms`);
      });
      next();
    });
  }
}
