import type {DbService, DbUser, Tx} from '../database';

export interface RecordedQuery {
  /** Query text with each bind parameter shown as `$n`, whitespace collapsed. */
  text: string;
  params: unknown[];
  role: 'authenticated' | 'service_role' | 'anon';
  userId?: string;
}

export interface FakeDb {
  db: DbService;
  queries: RecordedQuery[];
}

/**
 * A `DbService` stand-in for repository specs. Every tagged-template query is
 * recorded (text + bind params + the role it ran under) and answered with the
 * next scripted result: an array of rows, or an `Error` to throw. Without a
 * script entry the query returns no rows.
 */
export function createFakeDb(script: (readonly unknown[] | Error)[] = []): FakeDb {
  const queries: RecordedQuery[] = [];
  let next = 0;
  const run = <T>(role: RecordedQuery['role'], userId: string | undefined, fn: (tx: Tx) => Promise<T>): Promise<T> => {
    const tx = ((strings: TemplateStringsArray, ...params: unknown[]) => {
      const text = strings
        .reduce((acc, part, index) => acc + part + (index < params.length ? `$${String(index + 1)}` : ''), '')
        .replace(/\s+/g, ' ')
        .trim();
      queries.push({text, params, role, ...(userId === undefined ? {} : {userId})});
      const step = script[next++];
      return step instanceof Error ? Promise.reject(step) : Promise.resolve(step ?? []);
    }) as unknown as Tx;
    return fn(tx);
  };
  const db = {
    asUser: <T>(user: DbUser, fn: (tx: Tx) => Promise<T>) => run('authenticated', user.id, fn),
    asService: <T>(fn: (tx: Tx) => Promise<T>) => run('service_role', undefined, fn),
    asAnon: <T>(fn: (tx: Tx) => Promise<T>) => run('anon', undefined, fn)
  } as unknown as DbService;
  return {db, queries};
}
