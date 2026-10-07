import * as Sentry from '@sentry/nestjs';
import type {ErrorEvent} from '@sentry/nestjs';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-edit-token'];

/** Strip everything that must never leave the process: bodies, cookies, secret headers. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const request = event.request;
  if (request !== undefined) {
    delete request.data;
    delete request.cookies;
    if (request.headers !== undefined) {
      const headers: Record<string, string> = {};
      for (const [name, value] of Object.entries(request.headers)) {
        if (!SENSITIVE_HEADERS.includes(name.toLowerCase())) headers[name] = value;
      }
      request.headers = headers;
    }
  }
  delete event.user;
  return event;
}

/** Init options, or undefined (do nothing) when `SENTRY_DSN` is blank/unset. */
export function sentryOptionsFromEnv(env: NodeJS.ProcessEnv): Sentry.NodeOptions | undefined {
  const dsn = env.SENTRY_DSN?.trim();
  if (dsn === undefined || dsn === '') return undefined;
  const environment = env.SENTRY_ENVIRONMENT?.trim();
  return {
    dsn,
    environment: environment !== undefined && environment !== '' ? environment : (env.NODE_ENV ?? 'development'),
    // Collect nothing request-shaped by default; `beforeSend` is a second line of defence.
    dataCollection: {userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false},
    maxBreadcrumbs: 20,
    beforeSend: scrubEvent
  };
}

/**
 * Report an error to Sentry. Only server faults (5xx / unhandled) are
 * reported; 4xx never are. No-op unless Sentry was initialised.
 */
export function reportServerError(exception: unknown, status: number, requestId: string): void {
  if (status < 500 || !Sentry.isInitialized()) return;
  Sentry.withScope((scope) => {
    scope.setTag('request_id', requestId);
    Sentry.captureException(exception);
  });
}
