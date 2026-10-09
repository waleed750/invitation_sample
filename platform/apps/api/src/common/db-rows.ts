/**
 * Repositories select every row as one jsonb value (`to_jsonb(t) as r`). That
 * keeps the wire shapes the services always parsed (ISO timestamps with
 * microseconds, JSON numbers for bigint/numeric, nested objects for embeds)
 * independent of postgres.js type parsers.
 */
export interface JsonRow<T> {
  r: T;
}

/** First row's payload, or `null` when the query matched nothing. */
export function firstJson<T>(rows: readonly JsonRow<T>[]): T | null {
  return rows[0]?.r ?? null;
}

export function allJson<T>(rows: readonly JsonRow<T>[]): T[] {
  return rows.map((row) => row.r);
}

/** Payload of a `select fn(...) as result` call (jsonb/int results arrive already parsed). */
export interface RpcRow<T> {
  result: T;
}

export type RpcObject = Record<string, unknown>;

/** Result of an RPC that returns a jsonb object, or `null` for a SQL null. */
export function rpcObject(rows: readonly RpcRow<unknown>[]): RpcObject | null {
  const value = rows[0]?.result;
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as RpcObject) : null;
}
