import {createHmac} from 'node:crypto';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {revalidatePath} = vi.hoisted(() => ({revalidatePath: vi.fn()}));

vi.mock('next/cache', () => ({revalidatePath}));

import {POST} from './route';

const SECRET = 'r'.repeat(32);
const BODY = JSON.stringify({type: 'invitation', slug: 'ahmed-mona'});

function signedRequest(body: string, secret: string | null, signature: string | null): Request {
  const headers = new Headers();
  if (signature !== null) headers.set('x-signature', signature);
  return new Request('http://localhost/api/revalidate', {method: 'POST', headers, body});
}

function signatureFor(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    process.env.REVALIDATE_SECRET = SECRET;
  });

  it('revalidates both locale paths and answers {ok:true}', async () => {
    const response = await POST(signedRequest(BODY, SECRET, signatureFor(BODY, SECRET)));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ok: true});
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/ar/i/ahmed-mona');
    expect(revalidatePath).toHaveBeenCalledWith('/en/i/ahmed-mona');
  });

  it('answers 503 when the secret is missing or too short', async () => {
    for (const secret of ['', 'short']) {
      if (secret === '') delete process.env.REVALIDATE_SECRET;
      else process.env.REVALIDATE_SECRET = secret;
      const response = await POST(signedRequest(BODY, SECRET, signatureFor(BODY, SECRET)));
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ok: false});
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('answers 401 on a missing or wrong signature', async () => {
    for (const signature of [null, 'not-hex!!', signatureFor(BODY, 'w'.repeat(32))]) {
      const response = await POST(signedRequest(BODY, SECRET, signature));
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ok: false});
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('answers 400 on invalid JSON or schema', async () => {
    const bodies = [
      '{not json',
      JSON.stringify({type: 'invitation', slug: 'NOT-A-SLUG'}),
      JSON.stringify({type: 'other', slug: 'ahmed-mona'}),
      JSON.stringify({slug: 'ahmed-mona'}),
    ];
    for (const body of bodies) {
      const response = await POST(signedRequest(body, SECRET, signatureFor(body, SECRET)));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ok: false});
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
