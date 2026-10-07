import {Writable} from 'node:stream';
import pino from 'pino';
import {REDACT_PATHS, buildLoggerParams, resolveLogLevel} from './logging';
import {resolveRequestId} from './request-id';
import {sentryOptionsFromEnv, scrubEvent} from '../observability/sentry';

function capture(): {logger: pino.Logger; lines: () => Record<string, unknown>[]} {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    }
  });
  const logger = pino({redact: {paths: REDACT_PATHS, censor: '[REDACTED]'}}, stream);
  return {
    logger,
    lines: () => chunks.join('').trim().split('\n').map((line) => JSON.parse(line) as Record<string, unknown>)
  };
}

describe('logging', () => {
  it('is silent in test, info otherwise', () => {
    expect(resolveLogLevel('test')).toBe('silent');
    expect(resolveLogLevel('production')).toBe('info');
    expect(buildLoggerParams('test').pinoHttp).toMatchObject({level: 'silent'});
  });

  it('uses pretty transport only in development', () => {
    expect(JSON.stringify(buildLoggerParams('development'))).toContain('pino-pretty');
    expect(JSON.stringify(buildLoggerParams('production'))).not.toContain('pino-pretty');
  });

  it('redacts secret headers and sensitive fields at any common depth', () => {
    const {logger, lines} = capture();
    logger.info(
      {
        req: {headers: {authorization: 'Bearer SECRET', cookie: 'sid=SECRET', 'x-edit-token': 'SECRET', accept: 'json'}},
        phone: '+201000000000',
        body: {email: 'a@b.c', nested: {otp: '123456', password: 'SECRET'}},
        err: {response: {token: 'SECRET', code: '999'}}
      },
      'hello'
    );
    const text = JSON.stringify(lines()[0]);
    expect(text).not.toContain('SECRET');
    expect(text).not.toContain('201000000000');
    expect(text).not.toContain('a@b.c');
    expect(text).not.toContain('123456');
    expect(text).not.toContain('999');
    expect(text).toContain('json');
  });

  it('reuses an incoming request id and caches it on the request', () => {
    const req = {headers: {'x-request-id': ' abc '}} as never;
    expect(resolveRequestId(req)).toBe('abc');
    const generated = resolveRequestId({headers: {}} as never);
    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('sentry options', () => {
  it('returns nothing when SENTRY_DSN is unset or blank', () => {
    expect(sentryOptionsFromEnv({})).toBeUndefined();
    expect(sentryOptionsFromEnv({SENTRY_DSN: '  '})).toBeUndefined();
  });

  it('builds options with environment fallback and no PII', () => {
    const options = sentryOptionsFromEnv({SENTRY_DSN: 'https://k@o1.ingest.sentry.io/1', NODE_ENV: 'production'});
    expect(options).toMatchObject({environment: 'production', dataCollection: {httpBodies: [], httpHeaders: false}});
  });

  it('scrubs bodies, cookies and secret headers from events', () => {
    const event = scrubEvent({
      type: undefined,
      request: {data: {phone: '1'}, cookies: {a: 'b'}, headers: {Authorization: 'Bearer X', 'X-Edit-Token': 'Y', accept: 'json'}},
      user: {id: 'u'}
    });
    expect(event.request).toEqual({headers: {accept: 'json'}});
    expect(event.user).toBeUndefined();
  });
});
