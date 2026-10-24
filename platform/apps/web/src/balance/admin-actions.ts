'use server';

import {revalidatePath} from 'next/cache';
import {BalanceApiError, apiCall} from './server';

type State = {success: boolean; error?: string; message?: string; paidOrders?: number};

function failure(error: unknown): State {
  return {success: false, error: error instanceof BalanceApiError ? error.code : 'unknown_error'};
}

export async function confirmTopupAction(_previous: unknown, formData: FormData): Promise<State> {
  const topupId = String(formData.get('topupId') ?? '');
  const paidMajor = Number(String(formData.get('paidAmount') ?? '').replace(/,/g, ''));
  const paidAmountMinor = Math.round(paidMajor * 100);
  const txnRef = String(formData.get('txnRef') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  if (!Number.isFinite(paidAmountMinor) || paidAmountMinor <= 0 || txnRef === '') return {success: false, error: 'invalid_amount'};
  try {
    const result = await apiCall<{paidOrderIds: string[]}>('POST', `/v1/admin/topups/${encodeURIComponent(topupId)}/confirm`, {
      paidAmountMinor, txnRef, ...(note ? {note} : {}), ...(formData.get('acceptMismatch') === 'on' ? {acceptMismatch: true} : {}),
    });
    revalidatePath('/[locale]/admin/payments', 'page');
    return {success: true, message: 'topup_confirmed', paidOrders: result.paidOrderIds.length};
  } catch (error) {
    return failure(error);
  }
}

export async function rejectTopupAction(_previous: unknown, formData: FormData): Promise<State> {
  const topupId = String(formData.get('topupId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  try {
    await apiCall('POST', `/v1/admin/topups/${encodeURIComponent(topupId)}/reject`, {reason});
    revalidatePath('/[locale]/admin/payments', 'page');
    return {success: true, message: 'topup_rejected'};
  } catch (error) {
    return failure(error);
  }
}
