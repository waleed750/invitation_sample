import type {NestExpressApplication} from '@nestjs/platform-express';
import type {NextFunction, Request, Response} from 'express';
import helmet from 'helmet';
import type {AppConfigService} from '../config/app-config.service';
import {CLIENT_IP_MODE_KEY, parseTrustProxy} from './client-ip';

/** helmet options for a pure JSON API: nothing may be loaded or framed from an API response. */
export function buildHelmetOptions(csp: boolean): Parameters<typeof helmet>[0] {
  return {
    contentSecurityPolicy: csp
      ? {useDefaults: false, directives: {'default-src': ["'none'"], 'frame-ancestors': ["'none'"]}}
      : false,
    strictTransportSecurity: {maxAge: 63_072_000, includeSubDomains: true, preload: false},
    referrerPolicy: {policy: 'no-referrer'},
    crossOriginResourcePolicy: {policy: 'same-site'},
    frameguard: {action: 'deny'},
    xContentTypeOptions: true
  };
}

/**
 * Transport-level hardening shared by `main.ts` (via `setupApp`) and e2e tests:
 * trust-proxy, helmet, no `x-powered-by`, and strict CORS.
 */
export function applySecurity(app: NestExpressApplication, config: AppConfigService): void {
  const plan = parseTrustProxy(config.trustProxy);
  app.set('trust proxy', plan.setting);
  app.set(CLIENT_IP_MODE_KEY, plan.cloudflare ? 'cloudflare' : 'socket');
  app.disable('x-powered-by');

  const strict = helmet(buildHelmetOptions(true));
  // Swagger UI needs inline scripts/styles; relaxed only when the operator opted in, and only under /docs.
  const relaxed = helmet(buildHelmetOptions(false));
  app.use((req: Request, res: Response, next: NextFunction) => {
    (config.swaggerEnabled && req.path.startsWith('/docs') ? relaxed : strict)(req, res, next);
  });

  // Credentials only for the listed origins: the cors package reflects an origin only when it matches the list.
  app.enableCors({
    origin: config.webOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id', 'Retry-After'],
    maxAge: 600
  });
}
