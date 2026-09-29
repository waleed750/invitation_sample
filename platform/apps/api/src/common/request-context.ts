import {AsyncLocalStorage} from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` with a request context so any log line emitted while handling the
 * request can pick up the request id (see `AppLogger`). */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

/** The current request id, if called inside `runWithRequestContext`. */
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
