'use server';

import {z} from 'zod';
import {BalanceApiError, apiCall} from '@/balance/server';
import {NotSignedInError} from '@/commerce/api-errors';

export type AccountActionResult = {ok: true} | {ok: false; error: 'confirmation_mismatch' | 'admin_account' | 'not_signed_in' | 'failed'};

export async function updateNameAction(input: unknown): Promise<AccountActionResult> {
  const parsed = z.object({name: z.string().trim().min(1).max(80)}).safeParse(input);
  if (!parsed.success) return {ok: false, error: 'failed'};
  try {
    await apiCall('PATCH', '/v1/me', parsed.data);
    return {ok: true};
  } catch (error) {
    return {ok: false, error: error instanceof NotSignedInError ? 'not_signed_in' : 'failed'};
  }
}

/** Deletes the account after the customer typed their email. The API removes personal data and sign-in. */
export async function deleteAccountAction(input: unknown): Promise<AccountActionResult> {
  const parsed = z.object({confirmEmail: z.string().trim().min(3).max(254)}).safeParse(input);
  if (!parsed.success) return {ok: false, error: 'confirmation_mismatch'};
  try {
    await apiCall('POST', '/v1/me/delete', parsed.data);
    return {ok: true};
  } catch (error) {
    if (error instanceof NotSignedInError) return {ok: false, error: 'not_signed_in'};
    if (error instanceof BalanceApiError && (error.code === 'confirmation_mismatch' || error.code === 'admin_account')) return {ok: false, error: error.code};
    return {ok: false, error: 'failed'};
  }
}
