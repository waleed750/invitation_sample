import {Injectable, type NestMiddleware} from '@nestjs/common';
import type {NextFunction, Request, Response} from 'express';
import {REQUEST_ID_HEADER, resolveRequestId} from './request-id';
import {runWithRequestContext} from './request-context';

export {REQUEST_ID_HEADER};

export interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Resolves the request id (shared with pino-http, see `resolveRequestId`),
 * echoes it on the response, stores it on the request for the exception
 * filter, and installs it as the request context. Request/response logging
 * itself is done by pino-http (headers redacted, never bodies).
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req, res);
    runWithRequestContext({requestId}, () => {
      next();
    });
  }
}
