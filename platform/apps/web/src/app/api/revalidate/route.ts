import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {verifyRevalidateSignature} from '../../../lib/revalidate-signature';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const revalidateBodySchema = z.object({
  type: z.literal('invitation'),
  slug: z.string().min(1).max(160).regex(SLUG),
}).strict();

function parseBody(rawBody: string): {ok: true; slug: string} | {ok: false} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return {ok: false};
  }
  const result = revalidateBodySchema.safeParse(parsed);
  return result.success ? {ok: true, slug: result.data.slug} : {ok: false};
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 32) return Response.json({ok: false}, {status: 503});
  const rawBody = await request.text();
  if (!verifyRevalidateSignature({rawBody, signatureHeader: request.headers.get('x-signature'), secret})) {
    return Response.json({ok: false}, {status: 401});
  }
  const body = parseBody(rawBody);
  if (!body.ok) return Response.json({ok: false}, {status: 400});
  // next-intl routing uses `localePrefix: 'always'`, so only prefixed paths exist.
  revalidatePath(`/ar/i/${body.slug}`);
  revalidatePath(`/en/i/${body.slug}`);
  return Response.json({ok: true});
}
