'use server';

import {revalidatePath} from 'next/cache';
import {AdminApi, AdminApiError} from '../api';

export async function adjustEntitlementAction(prevState: unknown, formData: FormData) {
    const invitationId = formData.get('invitationId') as string;
  const addEditsStr = formData.get('addEdits') as string;
  const extendDaysStr = formData.get('extendDays') as string;
  const reason = formData.get('reason') as string;

  const addEdits = addEditsStr ? parseInt(addEditsStr, 10) : undefined;
  const extendDays = extendDaysStr ? parseInt(extendDaysStr, 10) : undefined;

  try {
    const api = new AdminApi();
    await api.adjustEntitlement(invitationId, {addEdits, extendDays, reason});
    revalidatePath('/[locale]/admin/customers/[id]', 'page');
    return {success: true, message: 'entitlement_adjusted'};
  } catch (error) {
    if (error instanceof AdminApiError) {
      return {success: false, error: error.code};
    }
    return {success: false, error: 'unknown_error'};
  }
}

export async function adjustPointsAction(prevState: unknown, formData: FormData) {
  const customerId = formData.get('customerId') as string;
    const deltaStr = formData.get('delta') as string;
  const reason = formData.get('reason') as string;

  const delta = parseInt(deltaStr, 10);

  try {
    const api = new AdminApi();
    await api.adjustPoints(customerId, {delta, reason});
    revalidatePath('/[locale]/admin/customers/[id]', 'page');
    return {success: true, message: 'points_adjusted'};
  } catch (error) {
    if (error instanceof AdminApiError) {
      return {success: false, error: error.code};
    }
    return {success: false, error: 'unknown_error'};
  }
}
