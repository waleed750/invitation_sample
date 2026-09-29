import type {ArgumentsHost} from '@nestjs/common';
import {HttpException, HttpStatus} from '@nestjs/common';
import {AppConfigService} from '../config/app-config.service';
import {AppLogger} from './app-logger';
import {HttpExceptionFilter} from './http-exception.filter';
import {setTestEnv} from '../test-helpers';

setTestEnv();

interface CapturedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

function runFilter(filter: HttpExceptionFilter, exception: unknown, requestId?: string): CapturedResponse {
  const captured: CapturedResponse = {statusCode: 0, headers: {}, body: undefined};
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({method: 'GET', url: '/v1/probe', requestId}),
      getResponse: () => ({
        status: (code: number) => {
          captured.statusCode = code;
          return {
            setHeader: (name: string, value: string) => {
              captured.headers[name] = value;
              return {json: (body: unknown) => void (captured.body = body)};
            }
          };
        }
      })
    })
  } as unknown as ArgumentsHost;
  filter.catch(exception, host);
  return captured;
}

function testFilter(production: boolean): HttpExceptionFilter {
  const config = {isProduction: production} as AppConfigService;
  const logger = {error: jest.fn()} as unknown as AppLogger;
  return new HttpExceptionFilter(config, logger);
}

describe('HttpExceptionFilter', () => {
  it('maps an HttpException to the error envelope with code, message and requestId', () => {
    const captured = runFilter(testFilter(true), new HttpException('No such thing', HttpStatus.NOT_FOUND), 'req-1');
    expect(captured.statusCode).toBe(404);
    expect(captured.body).toEqual({error: {code: 'not_found', message: 'No such thing', requestId: 'req-1'}});
    expect(captured.headers['x-request-id']).toBe('req-1');
  });

  it('joins array messages without leaking internals', () => {
    const err = new HttpException(
      {message: ['a must be a UUID', 'b is required'], error: 'Bad Request'},
      HttpStatus.BAD_REQUEST
    );
    const captured = runFilter(testFilter(true), err, 'req-2');
    expect(captured.statusCode).toBe(400);
    expect(captured.body).toEqual({
      error: {code: 'bad_request', message: 'a must be a UUID; b is required', requestId: 'req-2'}
    });
  });

  it('hides 500 detail in production but keeps it in non-production', () => {
    const boom = new Error('db connection string postgres://secret exploded');
    const prod = runFilter(testFilter(true), boom, 'req-3');
    expect(prod.statusCode).toBe(500);
    expect(prod.body).toEqual({error: {code: 'internal_error', message: 'Internal server error', requestId: 'req-3'}});
    expect(JSON.stringify(prod.body)).not.toContain('postgres');

    const dev = runFilter(testFilter(false), new HttpException('broken detail', HttpStatus.INTERNAL_SERVER_ERROR), 'req-4');
    expect(dev.body).toEqual({error: {code: 'internal_error', message: 'broken detail', requestId: 'req-4'}});
  });

  it('generates a requestId when the request has none', () => {
    const captured = runFilter(testFilter(true), new HttpException('nope', HttpStatus.FORBIDDEN));
    const body = captured.body as {error: {requestId: string}};
    expect(typeof body.error.requestId).toBe('string');
    expect(body.error.requestId.length).toBeGreaterThan(0);
    expect(captured.headers['x-request-id']).toBe(body.error.requestId);
  });

  it('maps 429 to the too_many_requests code', () => {
    const captured = runFilter(
      testFilter(true),
      new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS),
      'req-5'
    );
    expect(captured.statusCode).toBe(429);
    expect((captured.body as {error: {code: string}}).error.code).toBe('too_many_requests');
  });
});
