import {getCommerceClient} from '@/commerce';
import {buildRsvpCsv} from '@/guest/csv';
import {getPublicStore} from '@/guest';

export async function GET(_request: Request, {params}: {params: Promise<{locale: string; id: string}>}) {
  const {id} = await params;
  const invitation = await getCommerceClient().getInvitation(id);
  if (!invitation) return new Response('Not found', {status: 404});
  const csv = buildRsvpCsv(await getPublicStore().listRsvps(invitation.shareSlug));
  const filename = `guests-${id.replace(/[^a-zA-Z0-9_-]/gu, '_')}.csv`;
  return new Response(csv, {headers: {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="${filename}"`,
    'cache-control': 'private, no-store',
  }});
}
