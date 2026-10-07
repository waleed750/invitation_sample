import type {IncomingMessage, ServerResponse} from 'node:http';
import type {Params} from 'nestjs-pino';
import {resolveRequestId} from './request-id';

const SENSITIVE_KEYS = ['phone', 'email', 'token', 'password', 'code', 'otp'] as const;

/**
 * pino `redact` paths. Wildcards only match one level each, so the sensitive
 * field names are listed at depth 0-3 (covers `req.body.phone`,
 * `err.response.email`, etc.). Redacted values become `[REDACTED]`.
 */
export const REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-edit-token"]',
  'res.headers["set-cookie"]',
  ...SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`, `*.*.${key}`, `*.*.*.${key}`])
];

export type NodeEnv = 'development' | 'production' | 'test';

export function resolveLogLevel(nodeEnv: NodeEnv): 'silent' | 'info' {
  return nodeEnv === 'test' ? 'silent' : 'info';
}

/**
 * Logger config for `nestjs-pino`: JSON in production, pretty in development,
 * silent in tests. Every line carries the request id (`req.id` + `requestId`)
 * produced by the same resolver the `RequestIdMiddleware` uses.
 */
export function buildLoggerParams(nodeEnv: NodeEnv): Params {
  return {
    pinoHttp: {
      level: resolveLogLevel(nodeEnv),
      redact: {paths: REDACT_PATHS, censor: '[REDACTED]'},
      genReqId: (req: IncomingMessage, res: ServerResponse) => resolveRequestId(req, res),
      // Slim, query-free serializers: headers/bodies/query strings (which can
      // carry tokens) are not logged at all; `redact` stays as a safety net.
      serializers: {
        req: (req: {id?: unknown; method?: string; url?: string}) => ({
          id: req.id,
          method: req.method,
          url: req.url?.split('?')[0]
        }),
        res: (res: {statusCode?: number}) => ({statusCode: res.statusCode})
      },
      customProps: (req: IncomingMessage) => ({requestId: (req as {id?: unknown}).id}),
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, error?: Error) => {
        if (error !== undefined || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      ...(nodeEnv === 'development'
        ? {transport: {target: 'pino-pretty', options: {singleLine: true, colorize: true}}}
        : {})
    }
  };
}
