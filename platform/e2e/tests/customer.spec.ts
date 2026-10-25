import {expect, test, type Page} from '@playwright/test';
import {SEED, newSignedInContext, signIn} from '../helpers';

// T21: receipts, upgrades, share + QR, account export and deletion.
const run = Date.now().toString(36);

async function firstInvitationId(page: Page): Promise<string> {
  const hrefs = await page.locator('a[href*="/app/invitations/"]').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).pathname));
  const match = hrefs.map((h) => /invitations\/([0-9a-f-]{36})/.exec(h)?.[1]).find(Boolean);
  expect(match, 'a dashboard invitation link').toBeTruthy();
  return match ?? '';
}

function numberIn(text: string): number {
  const match = /\d[\d,]*(?:\.\d+)?/.exec(text);
  return Number((match?.[0] ?? '').replace(/,/g, ''));
}

test('a receipt matches the paid order and prints cleanly', async ({page}) => {
  await signIn(page, SEED.customer, '/ar/app/orders');
  const card = page.locator('.order-card').filter({has: page.locator('a[href$="/receipt"]')}).first();
  const link = card.locator('a[href$="/receipt"]');
  await expect(link).toBeVisible();
  const listed = numberIn(await card.locator('.order-card-amount').innerText());
  await link.click();
  await expect(page.getByTestId('receipt')).toBeVisible();
  expect(numberIn(await page.getByTestId('receipt-total').innerText())).toBeCloseTo(listed, 2);
  // With a discount, subtotal - discount = total.
  const subtotal = numberIn(await page.getByTestId('receipt-subtotal').innerText());
  const discount = (await page.getByTestId('receipt-discount').count()) > 0 ? numberIn(await page.getByTestId('receipt-discount').innerText()) : 0;
  expect(subtotal - discount).toBeCloseTo(listed, 2);
  // Printing hides the dashboard chrome and the buttons.
  await page.emulateMedia({media: 'print'});
  await expect(page.locator('.receipt-actions')).toBeHidden();
  await expect(page.locator('.dashboard-header')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('an order that is not paid has no receipt', async ({page}) => {
  await signIn(page, SEED.customer, '/ar/app');
  const response = await page.goto('/ar/app/orders/00000000-0000-4000-8000-000000000000/receipt');
  expect(response?.status()).toBe(404);
});

for (const vp of [{name: 'phone', width: 390, height: 844}, {name: 'desktop', width: 1280, height: 900}]) {
  test(`share page has the link, a QR PNG and WhatsApp text in both languages (${vp.name})`, async ({page}) => {
    await page.setViewportSize({width: vp.width, height: vp.height});
    await signIn(page, SEED.customer, '/ar/app');
    const id = await firstInvitationId(page);
    await page.goto(`/ar/app/share/${id}`);
    await expect(page.getByTestId('share-url')).toContainText('/i/');
    await expect(page.getByTestId('share-qr')).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect(page.getByTestId('qr-download')).toHaveAttribute('download', 'invitation-qr.png');
    const current = await page.getByTestId('whatsapp-current').getAttribute('href');
    const other = await page.getByTestId('whatsapp-other').getAttribute('href');
    expect(current).toContain('https://wa.me/?text=');
    // Arabic text in the Arabic UI, English in the other button.
    expect(decodeURIComponent(current ?? '')).toMatch(/[؀-ۿ]/);
    expect(decodeURIComponent(other ?? '')).toContain('We would love you');
    expect(decodeURIComponent(other ?? '')).toContain('/en/i/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({path: `test-results/share-${vp.name}.png`, fullPage: true});
  });
}

test('upgrades show the meters and buying a pack opens the pay page (cancelled afterwards)', async ({page}) => {
  await signIn(page, SEED.customer, '/ar/app');
  const id = await firstInvitationId(page);
  await page.goto(`/ar/app/upgrades?invitation=${id}`);
  await expect(page.getByTestId('meter-edits')).toBeVisible();
  await expect(page.getByTestId('meter-days')).toBeVisible();
  await expect(page.getByTestId('offer-extension')).toContainText('199');
  await expect(page.getByTestId('offer-edits')).toContainText('99');
  await page.screenshot({path: 'test-results/upgrades.png', fullPage: true});
  await expect(async () => {
    if (!/\/checkout\/pay\//.test(page.url())) await page.getByTestId('buy-edits').click({timeout: 2_000});
    await expect(page).toHaveURL(/\/ar\/checkout\/pay\//, {timeout: 20_000});
  }).toPass({timeout: 60_000});
  // The order is a normal order on the account; clean it up so reruns stay tidy.
  await page.goto('/ar/app/orders');
  const awaiting = page.locator('.awaiting-actions').first();
  if (await awaiting.isVisible().catch(() => false)) {
    await awaiting.getByRole('button', {name: /إلغاء الطلب/}).click();
    await awaiting.getByRole('button', {name: /نعم/}).click();
  }
});

test('a customer exports their own data and deletes their account', async ({browser}) => {
  const email = `e2e-del-${run}@example.test`;
  const {context, page} = await newSignedInContext(browser, email, '/ar/app/account');
  await expect(page.getByTestId('export-data')).toBeVisible();

  // Export: only this account's data.
  const exported = await page.request.get('/ar/app/account/export');
  expect(exported.status()).toBe(200);
  const text = await exported.text();
  expect(text).toContain(email);
  expect(text).not.toContain(SEED.customer);
  expect(text).not.toContain(SEED.admin);
  expect(exported.headers()['content-disposition']).toContain('attachment');

  // The name can be changed.
  await page.getByTestId('account-name').fill('سارة التجريبية');
  await page.getByRole('button', {name: 'حفظ'}).click();
  await expect(page.getByText('تم الحفظ')).toBeVisible();

  // Deletion needs the email typed exactly.
  const button = page.getByTestId('delete-account');
  await expect(button).toBeDisabled();
  await page.getByTestId('delete-confirm').fill('someone-else@example.test');
  await expect(button).toBeDisabled();
  await page.getByTestId('delete-confirm').fill(email);
  await expect(button).toBeEnabled();
  await button.click();
  await page.waitForURL((url) => url.searchParams.get('account') === 'deleted' || !url.pathname.includes('/app'), {timeout: 30_000});

  // The old session is dead.
  await page.goto('/ar/app');
  await expect(page).toHaveURL(/sign-in/);
  await context.close();

  // The same address now starts a brand-new, empty account.
  const again = await newSignedInContext(browser, email, '/ar/app/account');
  const fresh = await again.page.request.get('/ar/app/account/export');
  const body = (await fresh.json()) as {orders: unknown[]; invitations: unknown[]};
  expect(body.orders).toHaveLength(0);
  expect(body.invitations).toHaveLength(0);
  await again.context.close();
});
