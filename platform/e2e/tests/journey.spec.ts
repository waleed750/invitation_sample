import {expect, test, type Page} from '@playwright/test';
import {API_URL, SEED, newSignedInContext, signIn} from '../helpers';

// The whole customer journey, in Arabic, as one ordered story:
// sign in -> pick a template -> checkout (balance empty: the order waits) -> admin confirms the top-up -> the order is paid
// automatically -> edit -> publish -> guest RSVP -> owner sees it.
test.describe.configure({mode: 'serial'});

const run = Date.now().toString(36);
const customerEmail = `e2e-${run}@example.test`;
const guestName = `ضيف ${run}`;

let reference = '';
let invitationId = '';
let slug = '';

function futureDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

async function goThroughCheckout(page: Page): Promise<void> {
  // Details -> plan -> pay (the account is already verified, so there is no phone step).
  // Clicks are retried until the step advances, because a click before hydration is ignored.
  const toPlan = page.getByRole('button', {name: 'التالي: الباقة'}).first();
  const toPay = page.getByRole('button', {name: 'التالي: التأكيد والدفع'}).first();
  await expect(async () => {
    await toPlan.click({timeout: 2_000});
    await expect(toPay).toBeVisible({timeout: 2_000});
  }).toPass({timeout: 30_000});
  const pay = page.locator('.pay-cta-btn');
  await expect(async () => {
    await toPay.click({timeout: 2_000});
    await expect(pay).toBeEnabled({timeout: 2_000});
  }).toPass({timeout: 30_000});
  await pay.click();
}

test('customer signs in, picks a template and checks out', async ({page}) => {
  await signIn(page, customerEmail, '/ar/app/new');

  await page.locator('input[name=first]').fill('سارة');
  await page.locator('input[name=second]').fill('علي');
  await page.locator('input[name=date]').fill(futureDate());
  await page.locator('form button[type=submit]').click();

  await page.locator('a[href*="/app/new/mashrabiya"]').first().click();
  await expect(page.getByText('معاينة مشربية')).toBeVisible();
  await page.getByRole('link', {name: 'المتابعة إلى الدفع'}).click();

  await expect(page).toHaveURL(/\/ar\/checkout\/mashrabiya/);
  await goThroughCheckout(page);

  // The balance is empty, so the order is saved as "awaiting balance" and the top-up screen opens.
  await expect(page).toHaveURL(/\/ar\/checkout\/pay\//);
  await expect(async () => {
    await page.getByRole('button', {name: /عرض بيانات التحويل/}).click({timeout: 2_000});
    await expect(page.getByTestId('topup-reference')).toBeVisible({timeout: 4_000});
  }).toPass({timeout: 30_000});
  reference = (await page.getByTestId('topup-reference').innerText()).trim();
  expect(reference).toMatch(/^TOP-[A-Z0-9]{6}$/);
  // A real account never sees demo-mode copy.
  await expect(page.getByText('الوضع التجريبي')).toHaveCount(0);
});

test('admin sees the pending top-up and confirms it; the awaiting order is paid automatically', async ({browser}) => {
  const {context, page} = await newSignedInContext(browser, SEED.admin, '/ar/admin/payments');
  const card = page.locator(`[data-testid="pending-topup"][data-reference="${reference}"]`);
  await expect(card).toBeVisible();
  await card.getByRole('button', {name: 'تأكيد'}).click();
  await card.locator('input[name=txnRef]').fill(`E2E-${run}`);
  await card.locator('form button[type=submit]').click();
  await expect(card).toHaveCount(0);
  await context.close();
});

test('the paid invitation is active; the owner edits a text and publishes', async ({page}) => {
  await signIn(page, customerEmail, '/ar/app');
  const link = page.locator('a[href*="/app/invitations/"]').first();
  await expect(link).toBeVisible();
  const href = (await link.getAttribute('href')) ?? '';
  invitationId = /invitations\/([0-9a-f-]{36})/.exec(href)?.[1] ?? '';
  expect(invitationId).not.toBe('');

  // Edit one text through the owner API (the editor UI arrives with T11). Checkout stores only the
  // couple and date, so the first edit sends a complete, valid document.
  const current = await page.request.get(`${API_URL}/v1/invitations/${invitationId}`);
  expect(current.ok()).toBeTruthy();
  const body = (await current.json()) as {updatedAt: string};
  const names = {first: {ar: 'سارة', en: 'Sara'}, second: {ar: 'علي', en: 'Ali'}};
  const edited = {
    template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
    theme: {background: '#fbf6ee', foreground: '#2a2118', muted: '#7a6a58', ivory: '#fffdf8'},
    couple: {firstName: names.first, secondName: {ar: 'علي المعدّل', en: 'Edited Ali'}},
    event: {date: {ar: futureDate(), en: futureDate()}},
    media: {},
    copy: {},
    sections: [{type: 'hero', id: 'hero', props: {firstName: names.first, secondName: names.second, displayDate: {ar: 'قريباً', en: 'Soon'}}}],
  };
  const patch = await page.request.patch(`${API_URL}/v1/invitations/${invitationId}`, {
    data: {data: edited},
    headers: {'if-match': body.updatedAt},
  });
  expect(patch.status(), await patch.text()).toBeLessThan(300);

  await page.goto(`/ar/app/invitations/${invitationId}`);
  const publish = page.locator('form button[type=submit]').filter({hasText: /نشر|ننشر|تحديث/}).first();
  await expect(publish).toBeEnabled();
  await publish.click();
  await page.waitForLoadState('networkidle');

  const shareHref = await page.locator('a[href*="/i/"]').first().getAttribute('href');
  slug = /\/i\/([a-z0-9-]+)/.exec(shareHref ?? '')?.[1] ?? '';
  expect(slug).not.toBe('');
});

test('a guest opens the public page and sends an RSVP', async ({browser}) => {
  const context = await browser.newContext({locale: 'ar-EG'});
  const page = await context.newPage();
  await page.goto(`/ar/i/${slug}`);
  await expect(page.locator('body')).toContainText('سارة');
  // Guests first tap the intro open (clicks are retried until the page has hydrated).
  const open = page.getByRole('button', {name: 'اضغط لفتح الشبابيك'});
  await expect(async () => {
    await open.click({timeout: 2_000});
    await expect(open).toBeHidden({timeout: 4_000});
  }).toPass({timeout: 30_000});
  await page.locator('input[name=fullName]').scrollIntoViewIfNeeded();
  await page.locator('input[name=fullName]').fill(guestName);
  await page.locator('input[name=phone]').fill('+201000000099');
  // The radios are visually hidden inside styled labels, so click the label text.
  await page.getByText('بكل سرور، سأحضر').click();
  await page.getByRole('button', {name: 'إرسال التأكيد'}).click();
  await expect(page.locator('.rsvp-thanks')).toBeVisible();
  await context.close();
});

test('the owner sees the RSVP', async ({page}) => {
  await signIn(page, customerEmail, `/ar/app/invitations/${invitationId}/guests`);
  await expect(page.locator('body')).toContainText(guestName);
});
