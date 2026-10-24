import 'server-only';
import {BalanceApiError, apiCall} from '@/balance/server';
import {NotSignedInError} from '@/commerce/api-errors';

export type ActionResult = {ok: true; message?: string; data?: unknown} | {ok: false; error: string};

/** Runs an admin API call for a server action: success, or the API's machine code as `error`. */
export async function adminCall(method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', path: string, body?: unknown): Promise<ActionResult> {
  try {
    const data = await apiCall<unknown>(method, path, body);
    return {ok: true, data};
  } catch (error) {
    if (error instanceof NotSignedInError) return {ok: false, error: 'not_signed_in'};
    return {ok: false, error: error instanceof BalanceApiError ? error.code : 'unknown_error'};
  }
}

export const adminGet = <T>(path: string): Promise<T> => apiCall<T>('GET', path);

/** `""` -> undefined, so an empty optional field is left out of the request. */
export function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? undefined : text;
}

export function numberOrUndefined(value: FormDataEntryValue | null): number | undefined {
  const text = optional(value);
  if (text === undefined) return undefined;
  const parsed = Number(text.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}
