'use server';

import {revalidatePath} from 'next/cache';
import {AdminApi} from '../api';
import {AdminApiError} from '../api';

export async function confirmPaymentAction(prevState: unknown, formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const paidAmountMajor = parseInt(formData.get('paidAmountMajor') as string, 10);
  const paidAmountMinor = paidAmountMajor * 100;
  const txnRef = formData.get('txnRef') as string;
  const note = formData.get('note') as string;
  const acceptMismatch = formData.get('acceptMismatch') === 'on';

  try {
    const api = new AdminApi();
    await api.confirmPayment(orderId, {
      paidAmountMinor,
      txnRef,
      ...(note ? {note} : {}),
      ...(acceptMismatch ? {acceptMismatch} : {}),
    });
    revalidatePath('/[locale]/admin/payments', 'page');
    return {success: true, message: 'payment_confirmed'};
  } catch (error) {
    if (error instanceof AdminApiError) {
      return {success: false, error: error.code};
    }
    return {success: false, error: 'unknown_error'};
  }
}

export async function rejectPaymentAction(prevState: unknown, formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const reason = formData.get('reason') as string;

  try {
    const api = new AdminApi();
    await api.rejectPayment(orderId, {reason});
    revalidatePath('/[locale]/admin/payments', 'page');
    return {success: true, message: 'payment_rejected'};
  } catch (error) {
    if (error instanceof AdminApiError) {
      return {success: false, error: error.code};
    }
    return {success: false, error: 'unknown_error'};
  }
}
