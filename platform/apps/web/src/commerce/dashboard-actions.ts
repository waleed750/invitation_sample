'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {getPublicStore} from '@/guest';
import {getCommerceClient} from './index';

const localeSchema = z.enum(routing.locales);
const publishSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
});

export async function publishInvitationAction(input: unknown) {
  const parsed = publishSchema.parse(input);
  const result = await getCommerceClient().publishInvitation(parsed.id);
  if (result.ok && result.invitation.onlineUntil) {
    await getPublicStore().publish({
      shareSlug: result.invitation.shareSlug,
      templateSlug: result.invitation.templateSlug,
      tier: result.invitation.tier,
      couple: result.invitation.couple,
      eventDate: result.invitation.eventDate,
      publishedAt: new Date().toISOString(),
      onlineUntil: result.invitation.onlineUntil,
      locale: parsed.locale,
    });
    revalidatePath(`/${parsed.locale}/i/${result.invitation.shareSlug}`);
  }
  revalidatePath(`/${parsed.locale}/app`);
  revalidatePath(`/${parsed.locale}/app/invitations/${parsed.id}`);
  return result;
}

export async function signOutAction(formData: FormData) {
  const locale = localeSchema.parse(formData.get('locale'));
  await getCommerceClient().signOut();
  revalidatePath(`/${locale}/app`, 'layout');
  redirect({href: '/app', locale});
}
