import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {Response} from 'express';
import {AppConfigService} from '../config/app-config.service';
import {reportServerError} from '../observability/sentry';
import {AppLogger} from './app-logger';
import {isRecord} from './type-guards';
import {REQUEST_ID_HEADER, type RequestWithId} from './request-id.middleware';

function codeForStatus(status: number): string {
  const codes: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'bad_request',
    [HttpStatus.UNAUTHORIZED]: 'unauthorized',
    [HttpStatus.FORBIDDEN]: 'forbidden',
    [HttpStatus.NOT_FOUND]: 'not_found',
    [HttpStatus.CONFLICT]: 'conflict',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable_entity',
    [HttpStatus.TOO_MANY_REQUESTS]: 'too_many_requests',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal_error',
    [HttpStatus.BAD_GATEWAY]: 'bad_gateway',
    [HttpStatus.SERVICE_UNAVAILABLE]: 'service_unavailable'
  };
  return codes[status] ?? `http_${String(status)}`;
}

/** Error envelope returned by every endpoint: `{ error: { code, message, requestId } }`. */
export interface ErrorEnvelope {
  error: {code: string; message: string; requestId: string};
}

/**
 * Global catch-all filter. Normalizes every failure (HTTP or otherwise) into
 * the error envelope. Stack traces and internal details never leave the
 * server in production — they are logged server-side with the request id.
 */
@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithId>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId ?? randomUUID();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = codeForStatus(status);
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = status >= 500 && this.config.isProduction ? 'Internal server error' : body;
        code = codeForStatus(status);
      } else if (isRecord(body)) {
        const rawCode: unknown = body.code;
        code = typeof rawCode === 'string' ? rawCode : codeForStatus(status);
        const rawMessage: unknown = body.message;
        const extracted = Array.isArray(rawMessage)
          ? rawMessage.map((part) => String(part)).join('; ')
          : typeof rawMessage === 'string'
            ? rawMessage
            : exception.message;
        message = status >= 500 && this.config.isProduction ? 'Internal server error' : extracted;
      }
    }

    // Server-side only: full detail (including stack) stays in our logs.
    const detail = exception instanceof Error ? (exception.stack ?? exception.message) : String(exception);
    this.logger.error(`${req.method} ${req.url} -> ${String(status)} (${code}): ${detail}`);

    reportServerError(exception, status, requestId);

    res.status(status).setHeader(REQUEST_ID_HEADER, requestId).json({error: {code, message, requestId}});
  }
}
