import {NextResponse} from 'next/server';
import {BalanceApiError, apiCall} from '@/balance/server';
import {NotSignedInError} from '@/commerce/api-errors';

export const dynamic = 'force-dynamic';

/** Downloads the signed-in customer's own data as JSON (the API only ever returns that user's data). */
export async function GET(): Promise<Response> {
  try {
    const data = await apiCall<Record<string, unknown>>('GET', '/v1/me/export');
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="my-data.json"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof NotSignedInError) return new NextResponse(null, {status: 401});
    const status = error instanceof BalanceApiError ? error.status : 500;
    return new NextResponse(null, {status});
  }
}
