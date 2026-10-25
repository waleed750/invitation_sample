import {expect, test, type Page} from '@playwright/test';
import {API_URL, SEED, newSignedInContext} from '../helpers';

// T15: the one-button order flow.
const run = Date.now().toString(36);

function checkoutUrl(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return `/ar/checkout/mashrabiya?tier=classic&names=${encodeURIComponent('سارة & علي')}&date=${date.toISOString().slice(0, 10)}`;
}

async function toPay(page: Page): Promise<void> {
  const toPlan = page.getByRole('button', {name: 'التالي: الباقة'}).first();
  const toPayStep = page.getByRole('button', {name: 'التالي: التأكيد والدفع'}).first();
  await expect(async () => {
    await toPlan.click({timeout: 2_000});
    await expect(toPayStep).toBeVisible({timeout: 2_000});
  }).toPass({timeout: 30_000});
  const pay = page.locator('.pay-cta-btn');
  await expect(async () => {
    await toPayStep.click({timeout: 2_000});
    await expect(pay).toBeEnabled({timeout: 2_000});
  }).toPass({timeout: 30_000});
  await pay.click();
}

test('a visitor signs in inside checkout, without leaving the page', async ({browser}) => {
  const context = await browser.newContext({locale: 'ar-EG'});
  const page = await context.newPage();
  const email = `e2e-guest-${run}@example.test`;
  await page.goto(checkoutUrl());
  await expect(async () => {
    await page.getByRole('button', {name: 'التالي: الباقة'}).first().click({timeout: 2_000});
    await page.getByRole('button', {name: 'التالي: التأكيد والدفع'}).first().click({timeout: 2_000});
    await expect(page.getByTestId('checkout-signin')).toBeVisible({timeout: 2_000});
  }).toPass({timeout: 30_000});

  const box = page.getByTestId('checkout-signin');
  await box.locator('input[type=email]').fill(email);
  await box.locator('button[type=submit]').click();
  const codeInput = box.locator('input[autocomplete=one-time-code]');
  await expect(codeInput).toBeVisible();
  const code = await (await page.request.get(`${API_URL}/v1/__e2e/last-code`, {params: {email}})).json() as {code: string};
  await codeInput.fill(code.code);
  await box.locator('button[type=submit]').click();

  // Back on the same checkout, straight on the pay step, signed in.
  await expect(page).toHaveURL(/\/ar\/checkout\/mashrabiya.*step=3/);
  await expect(page.locator('.pay-cta-btn')).toBeEnabled();
  await expect(page.getByTestId('checkout-signin')).toHaveCount(0);
  await context.close();
});

test('with enough balance, one tap pays and the order is done', async ({browser}) => {
  const email = `e2e-rich-${run}@example.test`;
  const customer = await newSignedInContext(browser, email, '/ar/app');
  const me = await (await customer.page.request.get(`${API_URL}/v1/me`)).json() as {id: string};

  // The admin gives the customer credit (store credit, as a top-up would).
  const admin = await newSignedInContext(browser, SEED.admin, '/ar/admin');
  const adjust = await admin.page.request.post(`${API_URL}/v1/admin/credit/adjust`, {data: {userId: me.id, deltaMinor: 200000, note: 'e2e credit'}});
  expect(adjust.status(), await adjust.text()).toBe(200);
  await admin.context.close();

  await customer.page.goto(checkoutUrl());
  await toPay(customer.page);
  // One tap: the order is paid at once and the customer lands on the paid result.
  await expect(customer.page).toHaveURL(/\/ar\/checkout\/result\//);
  await expect(customer.page.locator('.status-seal.is-paid')).toBeVisible();
  await customer.context.close();
});

test('with too little balance, the waiting screen turns green by itself when the admin confirms', async ({browser}) => {
  const email = `e2e-wait-${run}@example.test`;
  const customer = await newSignedInContext(browser, email, '/ar/app');
  await customer.page.goto(checkoutUrl());
  await toPay(customer.page);

  await expect(customer.page).toHaveURL(/\/ar\/checkout\/pay\//);
  await expect(async () => {
    await customer.page.getByRole('button', {name: /عرض بيانات التحويل/}).click({timeout: 2_000});
    await expect(customer.page.getByTestId('i-have-paid')).toBeVisible({timeout: 4_000});
  }).toPass({timeout: 30_000});
  const reference = (await customer.page.getByTestId('topup-reference').innerText()).trim();
  await customer.page.getByTestId('i-have-paid').click();
  await expect(customer.page.getByText('نتحقق من وصول دفعتكم')).toBeVisible();

  const admin = await newSignedInContext(browser, SEED.admin, '/ar/admin/payments');
  const card = admin.page.locator(`[data-testid="pending-topup"][data-reference="${reference}"]`);
  await card.getByRole('button', {name: 'تأكيد'}).click();
  await card.locator('input[name=txnRef]').fill(`E2E-WAIT-${run}`);
  await card.locator('form button[type=submit]').click();
  await expect(card).toHaveCount(0);
  await admin.context.close();

  await expect(customer.page.getByTestId('order-paid')).toBeVisible({timeout: 30_000});
  await expect(customer.page).toHaveURL(/\/ar\/checkout\/result\//, {timeout: 15_000});
  await customer.context.close();
});
