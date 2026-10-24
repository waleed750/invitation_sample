import {expect, test, type Page} from '@playwright/test';
import {API_URL, SEED, newSignedInContext, signIn} from '../helpers';

// T23: private edit links.
const run = Date.now().toString(36);

/** A throwaway customer with a brand-new draft invitation (through the real checkout endpoint). */
async function customerWithDraft(browser: Parameters<typeof newSignedInContext>[0], email: string): Promise<{id: string; page: Page; close: () => Promise<void>}> {
  const {context, page} = await newSignedInContext(browser, email, '/ar/app');
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const response = await page.request.post(`${API_URL}/v1/checkout`, {
    headers: {'Idempotency-Key': `e2e-links-${run}-${email}`},
    data: {
      templateSlug: 'mashrabiya', tier: 'classic', kind: 'new', method: 'card', couple: {first: 'منى', second: 'كريم'},
      eventDate: `${date.toISOString().slice(0, 10)}T12:00:00+02:00`,
    },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
  await page.goto('/ar/app');
  const hrefs = await page.locator('a[href*="/app/invitations/"]').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).pathname));
  const id = hrefs.map((h) => /invitations\/([0-9a-f-]{36})/.exec(h)?.[1]).find(Boolean);
  expect(id, 'the new draft shows on the dashboard').toBeTruthy();
  return {id: id ?? '', page, close: () => context.close()};
}

async function issueLink(adminPage: Page, invitationId: string, label: string): Promise<string> {
  await adminPage.goto(`/ar/admin/invitations/${invitationId}`);
  await expect(async () => {
    await adminPage.getByTestId('link-label').fill(label);
    await adminPage.getByTestId('issue-link').click({timeout: 2_000});
    await expect(adminPage.getByTestId('new-link-url')).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  return (await adminPage.getByTestId('new-link-url').innerText()).trim();
}

test('a private link edits one invitation without signing in, can be revoked, and can be claimed', async ({browser}) => {
  const owner = await customerWithDraft(browser, `e2e-links-owner-${run}@example.test`);
  const adminCtx = await newSignedInContext(browser, SEED.admin, '/ar/admin');
  const url = await issueLink(adminCtx.page, owner.id, 'for Mona');
  expect(url).toMatch(/\/ar\/edit\/[A-Za-z0-9_-]{43}$/);
  const token = url.split('/').pop() ?? '';

  // Anyone holding the link edits the invitation: no account, no cookies.
  const visitor = await browser.newContext({locale: 'ar-EG'});
  const page = await visitor.newPage();
  await page.goto(new URL(url).pathname);
  await expect(page.getByTestId('save-status')).toBeVisible({timeout: 30_000});
  expect((await visitor.cookies()).filter((cookie) => cookie.name.includes('session'))).toHaveLength(0);
  await expect(page.getByTestId('claim-link')).toBeVisible();
  const skip = page.getByRole('button', {name: 'تخطي'});
  await expect(async () => {
    if (await skip.isVisible()) await skip.click({timeout: 1_000});
    await expect(skip).toHaveCount(0, {timeout: 1_000});
  }).toPass({timeout: 30_000});

  const first = page.locator('input').first();
  const name = `منى${run.slice(-3)}`;
  await first.fill(name);
  await expect(page.getByTestId('save-status')).toHaveAttribute('data-status', 'saved', {timeout: 25_000});

  // The change really reached the invitation: its owner sees it.
  const detail = await owner.page.request.get(`${API_URL}/v1/invitations/${owner.id}`);
  expect(JSON.stringify(await detail.json())).toContain(name);

  // The link is worthless anywhere else: another invitation, the profile, orders, the admin API.
  const header = {'x-edit-token': token};
  expect((await visitor.request.get(`${API_URL}/v1/invitations/00000000-0000-4000-8000-000000000001`, {headers: header})).status()).toBe(401);
  for (const path of ['/v1/me', '/v1/orders', '/v1/balance', '/v1/invitations', '/v1/admin/coupons', '/v1/media', '/v1/me/export']) {
    expect((await visitor.request.get(`${API_URL}${path}`, {headers: header})).status(), path).toBe(401);
  }
  expect((await visitor.request.post(`${API_URL}/v1/me/delete`, {headers: header, data: {confirmEmail: 'x@example.test'}})).status()).toBe(401);

  // The page is not cached and does not leak the secret through the referrer.
  const response = await visitor.request.get(url);
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  expect(response.headers()['cache-control']).toContain('no-store');

  // Revoking is instant.
  adminCtx.page.on('dialog', (dialog) => void dialog.accept());
  await adminCtx.page.goto(`/ar/admin/invitations/${owner.id}`);
  await expect(async () => {
    await adminCtx.page.getByTestId('revoke-link').first().click({timeout: 2_000});
    await expect(adminCtx.page.locator('[data-testid=link-row][data-status=revoked]')).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  await page.reload();
  await expect(page.getByTestId('edit-link-invalid')).toBeVisible();
  expect((await visitor.request.get(`${API_URL}/v1/invitations/${owner.id}`, {headers: header})).status()).toBe(401);

  await visitor.close();
  await adminCtx.context.close();
  await owner.close();
});

test('"Save to my account" moves the invitation to the customer who signs in', async ({browser}) => {
  const first = await customerWithDraft(browser, `e2e-links-seller-${run}@example.test`);
  const adminCtx = await newSignedInContext(browser, SEED.admin, '/ar/admin');
  const url = await issueLink(adminCtx.page, first.id, 'to claim');

  // A different person opens the link and chooses to save it to their own account.
  const receiverEmail = `e2e-links-receiver-${run}@example.test`;
  const receiver = await browser.newContext({locale: 'ar-EG'});
  const page = await receiver.newPage();
  await page.goto(`${new URL(url).pathname}?claim=1`);
  await expect(page).toHaveURL(/sign-in/);
  const {signIn: signInThere} = await import('../helpers');
  const codeBefore = await page.request.get(`${API_URL}/v1/__e2e/last-code`, {params: {email: receiverEmail}}).then(async (r) => (r.ok() ? ((await r.json()) as {code: string}).code : undefined));
  await page.locator('input[type=email]').fill(receiverEmail);
  await page.locator('form button[type=submit]').click();
  const codeInput = page.locator('input[autocomplete=one-time-code]');
  await expect(codeInput).toBeVisible();
  const {latestCode} = await import('../helpers');
  await codeInput.fill(await latestCode(page.request, receiverEmail, codeBefore));
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(/\/app\/invitations\/[0-9a-f-]{36}\/edit/, {timeout: 40_000});
  expect(page.url()).toContain(first.id);
  void signInThere;

  // It is theirs now, and the old owner no longer sees it; the link is dead.
  const mine = await page.request.get(`${API_URL}/v1/invitations/${first.id}`);
  expect(mine.status()).toBe(200);
  expect((await first.page.request.get(`${API_URL}/v1/invitations/${first.id}`)).status()).toBe(404);
  const dead = await browser.newContext();
  await dead.newPage().then((p) => p.goto(new URL(url).pathname));
  const check = await dead.request.post(`${API_URL}/v1/edit-links/resolve`, {data: {token: url.split('/').pop()}});
  expect(check.status()).toBe(404);

  await dead.close();
  await receiver.close();
  await adminCtx.context.close();
  await first.close();
});

test('a customer cannot open the admin page that issues links', async ({page}) => {
  await signIn(page, SEED.customer, '/ar/app');
  const response = await page.goto('/ar/admin/invitations/00000000-0000-4000-8000-000000000001');
  expect(response?.status()).toBe(404);
});
