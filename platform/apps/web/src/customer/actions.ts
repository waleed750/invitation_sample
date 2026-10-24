'use server';

import {z} from 'zod';
import {redirect} from '@/i18n/navigation';
import {getCommerceClient} from '@/commerce';

const localeSchema = z.enum(['ar', 'en']);

export type UpgradeResult = {ok: false; error: 'not_found' | 'failed'};

/**
 * Starts an extension / edits-pack order for one of the caller's invitations and opens its pay page.
 * The server decides the plan, price and target from the invitation itself; the browser only names the invitation and the pack.
 */
export async function buyUpgradeAction(input: unknown): Promise<UpgradeResult> {
  const parsed = z.object({locale: localeSchema, invitationId: z.string().min(1).max(80), kind: z.enum(['extension', 'edits'])}).safeParse(input);
  if (!parsed.success) return {ok: false, error: 'failed'};
  const {locale, invitationId, kind} = parsed.data;
  const client = getCommerceClient();
  const invitation = await client.getInvitation(invitationId);
  if (!invitation) return {ok: false, error: 'not_found'};
  let orderId: string;
  try {
    const order = await client.startCheckout({
      templateSlug: invitation.templateSlug,
      tier: invitation.tier,
      kind,
      method: 'card',
      invitationId: invitation.id,
      couple: {first: invitation.couple.first || '-', second: invitation.couple.second || '-'},
      eventDate: /^\d{4}-\d{2}-\d{2}$/.test(invitation.eventDate) ? invitation.eventDate : new Date().toISOString().slice(0, 10),
    });
    orderId = order.id;
  } catch {
    return {ok: false, error: 'failed'};
  }
  redirect({href: `/checkout/pay/${orderId}`, locale});
  return {ok: false, error: 'failed'};
}
