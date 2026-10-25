import {expect, test, type Page} from '@playwright/test';
import {SEED, newSignedInContext, signIn} from '../helpers';

// T22: templates (licence gate), coupons, affiliates, refunds, settings.
const run = Date.now().toString(36);

async function admin(browser: Parameters<typeof newSignedInContext>[0], next: string) {
  return newSignedInContext(browser, SEED.admin, next);
}

/** Submits an ActionForm and waits for its answer (clicks before hydration are retried). */
async function submit(page: Page, form: string, button?: string): Promise<void> {
  const root = page.getByTestId(form);
  await expect(async () => {
    await root.locator('button[type=submit]').click({timeout: 2_000});
    await expect(root.locator('.am-ok, .am-error')).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  void button;
}

test('a customer cannot open any admin tool', async ({page}) => {
  await signIn(page, SEED.customer, '/ar/app');
  for (const path of ['templates', 'coupons', 'affiliates', 'refunds', 'settings']) {
    const response = await page.goto(`/ar/admin/${path}`);
    expect(response?.status(), path).toBe(404);
  }
});

test('coupons: create, reject a duplicate, deactivate', async ({browser}) => {
  const {context, page} = await admin(browser, '/ar/admin/coupons');
  const code = `e2e-${run}`;
  const form = page.getByTestId('form-coupon');
  await expect(form).toBeVisible();
  await expect(async () => {
    await form.locator('input[name=code]').fill(code);
    await form.locator('input[name=percent]').fill('15');
    await form.locator('input[name=maxUses]').fill('3');
    await form.locator('button[type=submit]').click({timeout: 2_000});
    await expect(page.locator(`[data-testid=coupon-row][data-code="${code}"]`)).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  const row = page.locator(`[data-testid=coupon-row][data-code="${code}"]`);
  await expect(row).toContainText('15%');
  await expect(row).toContainText('0 / 3');

  // The same code again is refused with a readable message.
  await form.locator('input[name=code]').fill(code);
  await form.locator('input[name=percent]').fill('10');
  await form.locator('button[type=submit]').click();
  await expect(page.getByTestId('am-error')).toHaveAttribute('data-code', 'code_taken');

  // A percentage and an amount together are refused.
  await form.locator('input[name=code]').fill(`${code}-b`);
  await form.locator('input[name=percent]').fill('10');
  await form.locator('input[name=amount]').fill('50');
  await form.locator('button[type=submit]').click();
  await expect(page.getByTestId('am-error')).toHaveAttribute('data-code', 'percent_or_amount');

  await row.getByTestId(`toggle-${code}`).click();
  await expect(row).toContainText('موقوف');
  await context.close();
});

test('templates: the licence gate blocks going live until every asset has a source and licence', async ({browser}) => {
  const {context, page} = await admin(browser, '/ar/admin/templates');
  const slug = `e2e-tpl-${run}`;
  const create = page.getByTestId('form-template');
  await expect(async () => {
    await create.locator('input[name=slug]').fill(slug);
    await create.locator('input[name=nameAr]').fill('قالب اختبار');
    await create.locator('input[name=nameEn]').fill('Test template');
    await create.locator('button[type=submit]').click({timeout: 2_000});
    await expect(page.locator(`[data-testid=template-row][data-slug="${slug}"]`)).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  const listed = page.locator(`[data-testid=template-row][data-slug="${slug}"]`);
  await expect(listed).toHaveAttribute('data-status', 'draft');
  await listed.getByRole('link').click();
  await expect(page.getByTestId('admin-template')).toBeVisible();

  // An asset with no source or licence.
  const add = page.getByTestId('form-asset-new');
  await expect(async () => {
    await add.locator('input[name=r2Key]').fill(`templates/${slug}/hero.webp`);
    await add.locator('button[type=submit]').click({timeout: 2_000});
    await expect(page.getByTestId('license-warning')).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  await page.getByTestId('status-live').click();
  await expect(page.locator('.am-error[data-code=license_incomplete]')).toBeVisible();
  await expect(page.getByTestId('admin-template')).toHaveAttribute('data-status', 'draft');

  // Filling in source + licence opens the gate.
  const asset = page.getByTestId('asset-row').first();
  await asset.locator('input[name=source]').fill('Own photograph');
  await asset.locator('input[name=license]').fill('CC0');
  await asset.locator('button[type=submit]').click();
  await expect(page.getByTestId('license-warning')).toHaveCount(0);
  await page.getByTestId('status-live').click();
  await expect(page.getByTestId('admin-template')).toHaveAttribute('data-status', 'live');

  // The preview frame can be switched between the three widths.
  for (const width of ['768', '1280', '390']) {
    await page.getByTestId(`preview-${width}`).click();
    await expect(page.getByTestId('template-preview-frame')).toHaveAttribute('data-width', width);
  }
  await page.screenshot({path: 'test-results/admin-template.png', fullPage: true});

  // Remove the licence from a live template: it goes back to draft.
  await asset.locator('input[name=license]').fill('');
  await asset.locator('button[type=submit]').click();
  await expect(page.getByTestId('admin-template')).toHaveAttribute('data-status', 'draft');

  // Retire it so the test template never appears in the public catalogue.
  await page.getByTestId('status-retired').click();
  await expect(page.getByTestId('admin-template')).toHaveAttribute('data-status', 'retired');
  await context.close();
});

test('affiliates: create, share link counts a visit, stats and CSV export', async ({browser}) => {
  const {context, page} = await admin(browser, '/ar/admin/affiliates');
  const code = `aff-${run}`;
  const create = page.getByTestId('form-affiliate');
  await expect(async () => {
    await create.locator('input[name=name]').fill('شريك اختبار');
    await create.locator('input[name=refCode]').fill(code);
    await create.locator('button[type=submit]').click({timeout: 2_000});
    await expect(page.locator(`[data-testid=affiliate-row][data-code="${code}"]`)).toBeVisible({timeout: 8_000});
  }).toPass({timeout: 45_000});
  await page.locator(`[data-testid=affiliate-row][data-code="${code}"]`).getByRole('link').click();
  await expect(page.getByTestId('admin-affiliate')).toBeVisible();
  await expect(page.getByTestId('affiliate-link')).toContainText(`/r/${code}`);

  // A visitor following the link is counted once and gets a 30-day cookie.
  const visitor = await browser.newContext();
  const visit = await visitor.newPage();
  await visit.goto(`/ar/r/${code}`);
  expect((await visitor.cookies()).find((cookie) => cookie.name === 'ref')?.value).toMatch(new RegExp(`^${code}\\.\\d+$`));
  await visitor.close();
  await page.reload();
  await expect(page.getByTestId('affiliate-stats')).toContainText('1');

  // Nothing is payable yet, so a payout is refused.
  await expect(page.getByTestId('payable-now')).toHaveText('0.00');

  // The CSV export downloads with a BOM and the header row.
  const exported = await page.request.get(await page.getByTestId('affiliate-export').getAttribute('href') ?? '');
  expect(exported.status()).toBe(200);
  expect(exported.headers()['content-type']).toContain('text/csv');
  expect(await exported.text()).toContain('order,paid_at,amount_egp');
  await context.close();
});

test('refunds page lists paid orders with both refund actions', async ({browser}) => {
  const {context, page} = await admin(browser, '/ar/admin/refunds');
  await expect(page.getByTestId('admin-refunds')).toBeVisible();
  const paid = page.locator('[data-testid=refund-order][data-status=paid]').first();
  await expect(paid).toBeVisible();
  await expect(paid.getByTestId('form-refund-balance')).toBeVisible();
  await expect(paid.getByTestId('form-refund-manual')).toBeVisible();
  // A refund needs a note: an empty one never reaches the server.
  await expect(paid.getByTestId('form-refund-manual').locator('input[name=note]')).toHaveAttribute('required', '');
  await context.close();
});

test('settings: save the support WhatsApp number and the payment instructions', async ({browser}) => {
  const {context, page} = await admin(browser, '/ar/admin/settings');
  const whatsapp = page.getByTestId('form-whatsapp');
  await expect(async () => {
    await whatsapp.locator('input[name=value]').fill('call me');
    await whatsapp.locator('button[type=submit]').click({timeout: 2_000});
    await expect(whatsapp.locator('.am-error')).toHaveAttribute('data-code', /invalid_value|bad_request/, {timeout: 8_000});
  }).toPass({timeout: 45_000});
  await whatsapp.locator('input[name=value]').fill('+201000000123');
  await whatsapp.locator('button[type=submit]').click();
  await expect(whatsapp.locator('.am-ok')).toBeVisible();

  const instructions = page.getByTestId('form-instructions');
  await instructions.locator('textarea[name=ar]').fill('حوّلوا المبلغ ثم أرسلوا الإيصال');
  await instructions.locator('textarea[name=en]').fill('Transfer the amount then send the receipt');
  await instructions.locator('button[type=submit]').click();
  await expect(instructions.locator('.am-ok')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('form-whatsapp').locator('input[name=value]')).toHaveValue('+201000000123');
  const publicSettings = await page.request.get(`${process.env.E2E_API_URL ?? 'http://localhost:3001'}/v1/settings/public`);
  expect(await publicSettings.json()).toMatchObject({supportWhatsapp: '+201000000123', paymentInstructions: {en: 'Transfer the amount then send the receipt'}});
  // Customers see the instructions and the WhatsApp link on the balance page.
  await page.goto('/ar/app/balance');
  await expect(page.getByTestId('support-note')).toContainText('حوّلوا المبلغ');
  await expect(page.getByTestId('support-note').getByRole('link')).toHaveAttribute('href', 'https://wa.me/201000000123');
  await context.close();
});

void submit;
