/* eslint-disable */
import {createHmac} from 'node:crypto';
import {RevalidationService} from './revalidation.service';

const SECRET = 'r'.repeat(32);
const WEB_URL = 'https://web.example.com/api/revalidate';

function make(url: string | undefined, secret: string | undefined = SECRET) {
  const logger = {log: jest.fn(), warn: jest.fn(), error: jest.fn()};
  const config = {webRevalidateUrl: url, revalidateSecret: secret};
  return {service: new RevalidationService(config as any, logger as any), logger};
}

describe('RevalidationService', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Runs delivery to completion while advancing fake timers (backoff sleeps). */
  async function run(service: RevalidationService, slug = 'ahmed-mona'): Promise<void> {
    const done = service.deliver(slug);
    await jest.runAllTimersAsync();
    await done;
  }

  it('posts the signed body once on success', async () => {
    fetchMock.mockResolvedValue({ok: true, status: 200});
    const {service} = make(WEB_URL);
    await run(service);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.stringify({type: 'invitation', slug: 'ahmed-mona'});
    expect(url).toBe(WEB_URL);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(body);
    expect(init.headers['x-signature']).toBe(createHmac('sha256', SECRET).update(body).digest('hex'));
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('is disabled when the URL is blank: no fetch, only a log', async () => {
    const {service, logger} = make(undefined, undefined);
    await run(service);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('retries a non-2xx then succeeds', async () => {
    fetchMock.mockResolvedValueOnce({ok: false, status: 502}).mockResolvedValueOnce({ok: true, status: 200});
    const {service, logger} = make(WEB_URL);
    await run(service);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('gives up after 3 attempts without throwing, and logs no secret', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const {service, logger} = make(WEB_URL);
    await expect(run(service)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(SECRET);
  });

  it('treats a timeout (abort) as a failed attempt', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('The operation was aborted due to timeout'), {name: 'TimeoutError'}));
    const {service} = make(WEB_URL);
    await run(service);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('revalidateInvitation returns synchronously and never throws', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    const {service} = make(WEB_URL);
    expect(service.revalidateInvitation('ahmed-mona')).toBeUndefined();
    await jest.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
