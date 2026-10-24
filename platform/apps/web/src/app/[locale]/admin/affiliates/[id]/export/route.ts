import {NextResponse} from 'next/server';
import {BalanceApiError, apiText} from '@/balance/server';
import {NotSignedInError} from '@/commerce/api-errors';

export const dynamic = 'force-dynamic';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

/** CSV of an affiliate's paid orders. The API checks the admin role; this only forwards the user's session. */
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}): Promise<Response> {
  const {id} = await params;
  if (!UUID.test(id)) return new NextResponse(null, {status: 404});
  const url = new URL(request.url);
  const range = new URLSearchParams();
  for (const key of ['from', 'to'] as const) {
    const value = url.searchParams.get(key);
    if (value && DATE.test(value)) range.set(key, value);
  }
  try {
    const csv = await apiText(`/v1/admin/affiliates/${id}/export${range.size > 0 ? `?${range.toString()}` : ''}`);
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="affiliate-orders.csv"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof NotSignedInError) return new NextResponse(null, {status: 401});
    return new NextResponse(null, {status: error instanceof BalanceApiError ? error.status : 500});
  }
}
