import {expect, test} from '@playwright/test';
import {API_URL, SEED, newSignedInContext, signIn} from '../helpers';

// T13: an order the balance cannot cover waits ("awaiting balance"); a confirmed top-up pays it automatically.
const run = Date.now().toString(36);
const email = `e2e-bal-${run}@example.test`;

test('awaiting order -> top up -> admin confirms -> paid automatically', async ({page, browser}) => {
  await signIn(page, email, '/ar/app/balance');
  await expect(page.getByTestId('balance-amount')).toBeVisible();

  // An order is created and the balance (zero) cannot pay it: it parks as "awaiting balance".
  const checkout = await page.request.post(`${API_URL}/v1/checkout`, {
    data: {templateSlug: 'diwan', tier: 'classic', kind: 'new', method: 'wallet', couple: {first: 'ليلى', second: 'كريم'}, eventDate: '2027-09-10T12:00:00+02:00'},
    headers: {'idempotency-key': `e2e-${run}`},
  });
  expect(checkout.status(), await checkout.text()).toBeLessThan(300);
  const orderId = ((await checkout.json()) as {orderId: string}).orderId;

  const pay = await page.request.post(`${API_URL}/v1/orders/${orderId}/pay-with-balance`, {data: {}});
  expect(pay.status()).toBe(200);
  expect(await pay.json()).toMatchObject({paid: false, status: 'awaiting_balance', shortfallMinor: 129900});

  // The order shows in My orders with the "top up and pay" action.
  await page.goto('/ar/app/orders');
  await expect(page.getByText('بانتظار الرصيد')).toBeVisible();
  await expect(page.getByRole('button', {name: 'اشحنوا وادفعوا'})).toBeVisible();

  // The balance page lists it and offers the shortfall; creating the top-up shows the exact amount and a reference.
  await page.goto('/ar/app/balance');
  await expect(page.getByText('طلبات في انتظار الرصيد')).toBeVisible();
  const amountInput = page.locator('input[name=amount]');
  await expect(amountInput).toHaveValue('1299');
  await expect(async () => {
    await page.getByRole('button', {name: 'عرض بيانات التحويل'}).click({timeout: 2_000});
    await expect(page.getByTestId('topup-card')).toBeVisible({timeout: 4_000});
  }).toPass({timeout: 30_000});
  const reference = (await page.getByTestId('topup-reference').innerText()).trim();
  expect(reference).toMatch(/^TOP-[A-Z0-9]{6}$/);

  // The admin sees the top-up and confirms it.
  const admin = await newSignedInContext(browser, SEED.admin, '/ar/admin/payments');
  const card = admin.page.locator(`[data-testid="pending-topup"][data-reference="${reference}"]`);
  await expect(card).toBeVisible();
  await card.getByRole('button', {name: 'تأكيد'}).click();
  await card.locator('input[name=txnRef]').fill(`E2E-TOP-${run}`);
  await card.locator('form button[type=submit]').click();
  await expect(card).toHaveCount(0);
  await admin.context.close();

  // The waiting page notices by itself and the order is paid automatically.
  await expect(page.getByTestId('balance-received')).toBeVisible({timeout: 30_000});
  await page.goto('/ar/app/orders');
  await expect(page.locator('.status-badge--paid').first()).toBeVisible();
  await expect(page.getByRole('button', {name: 'اشحنوا وادفعوا'})).toHaveCount(0);
});
