'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {getCommerceClient} from './index';

const localeSchema = z.enum(routing.locales);
const publishSchema = z.object({
  locale: localeSchema,
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
});

export async function publishInvitationAction(input: unknown) {
  const parsed = publishSchema.parse(input);
  const result = await getCommerceClient().publishInvitation(parsed.id);
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
