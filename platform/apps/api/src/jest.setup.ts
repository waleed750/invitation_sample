import {setTestEnv} from './testing/env';

// Runs before any spec file (see `setupFiles` in jest.config.js): importing
// `AppModule` executes `ConfigModule.forRoot({ validate })` at module scope,
// so valid env must already exist before the first import.
setTestEnv();

// The test env points external services at an unroutable address and no spec may touch
// the network. Fail those calls instantly instead of waiting on timeouts;
// services map the rejection to 503.
const originalFetch: typeof fetch = globalThis.fetch.bind(globalThis);
function fetchTargetUrl(target: unknown): string {
  if (typeof target === 'string') return target;
  if (target instanceof URL) return target.href;
  // `Request` instances (and anything URL-like) carry `.url`; `in` narrows it.
  if (typeof target === 'object' && target !== null && 'url' in target && typeof target.url === 'string') {
    return target.url;
  }
  return '';
}
globalThis.fetch = (...args: Parameters<typeof fetch>): ReturnType<typeof fetch> => {
  if (fetchTargetUrl(args[0]).includes('127.0.0.1:9')) {
    return Promise.reject(new TypeError('fetch failed (test stub: external service is unreachable)'));
  }
  return originalFetch(...args);
};
