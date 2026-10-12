'use server';

import {revalidatePath} from 'next/cache';
import {AdminApi, AdminApiError} from '../api';

export async function assignPaymentEventAction(prevState: unknown, formData: FormData) {
  const eventId = formData.get('eventId') as string;
  const orderId = formData.get('orderId') as string;
  const note = formData.get('note') as string;

  if (!orderId || !orderId.trim()) {
    return {success: false, error: 'not_found'};
  }
  if (!note || !note.trim()) {
    return {success: false, error: 'note_required'};
  }

  try {
    const api = new AdminApi();
    await api.assignPaymentEvent(eventId, {
      orderId: orderId.trim(),
      note: note.trim()
    });
    revalidatePath('/[locale]/admin/payment-events', 'page');
    return {success: true};
  } catch (error) {
    if (error instanceof AdminApiError) {
      if (error.status === 404) {
        return {success: false, error: 'not_found'};
      }
      return {success: false, error: error.code};
    }
    return {success: false, error: 'unknown_error'};
  }
}
