import {expect, test} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {API_URL, SEED, newSignedInContext, signIn} from '../helpers';

const run = Date.now().toString(36);

test('a friend link attributes the first paid balance order and rewards its owner', async ({browser}) => {
  const referrer = await newSignedInContext(browser, SEED.customer, '/ar/app/points');
  const invite = referrer.page.locator('.points-invite-link');
  await expect(invite).toBeVisible();
  const inviteUrl = (await invite.innerText()).trim();
  const code = /\/invite\/(f-[a-hj-np-z2-9]{8})$/.exec(inviteUrl)?.[1];
  expect(code).toBeTruthy();
  const before = Number((await (await referrer.page.request.get(`${API_URL}/v1/points`)).json() as {referral: {rewarded: number}}).referral.rewarded);

  const friendContext = await browser.newContext({locale: 'ar-EG'});
  const friend = await friendContext.newPage();
  await friend.goto(`/ar/invite/${code}`);
  await expect(friend).toHaveURL(/\/ar\/?$/);
  expect((await friendContext.cookies()).find((cookie) => cookie.name === 'friend')?.value).toBe(code);

  const email = `e2e-friend-${run}@example.test`;
  await signIn(friend, email, '/ar/app/points');
  const me = await (await friend.request.get(`${API_URL}/v1/me`)).json() as {id: string};
  const admin = await newSignedInContext(browser, SEED.admin, '/ar/admin');
  const adjust = await admin.page.request.post(`${API_URL}/v1/admin/credit/adjust`, {data: {userId: me.id, deltaMinor: 200000, note: 'e2e referral credit'}});
  expect(adjust.status(), await adjust.text()).toBe(200);
  await admin.context.close();

  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  await friend.goto(`/ar/checkout/mashrabiya?tier=classic&names=${encodeURIComponent('ليلى & كريم')}&date=${date.toISOString().slice(0, 10)}`);
  await expect(async () => {
    await friend.getByRole('button', {name: 'التالي: الباقة'}).first().click({timeout: 2_000});
    await expect(friend.getByRole('button', {name: 'التالي: التأكيد والدفع'}).first()).toBeVisible({timeout: 2_000});
  }).toPass({timeout: 30_000});
  await expect(async () => {
    await friend.getByRole('button', {name: 'التالي: التأكيد والدفع'}).first().click({timeout: 2_000});
    await expect(friend.locator('.pay-cta-btn')).toBeEnabled({timeout: 2_000});
  }).toPass({timeout: 30_000});
  await friend.locator('.pay-cta-btn').click();
  await expect(friend).toHaveURL(/\/ar\/checkout\/result\//);
  await expect(friend.locator('.status-seal.is-paid')).toBeVisible();

  await expect.poll(async () => {
    const result = await referrer.page.request.get(`${API_URL}/v1/points`);
    return ((await result.json()) as {referral: {rewarded: number}}).referral.rewarded;
  }).toBe(before + 1);
  await referrer.page.reload();
  await expect(referrer.page.getByText(/مكافأة دعوة صديق/)).toBeVisible();

  for (const locale of ['ar', 'en'] as const) {
    await mkdir('screenshots/C1', {recursive: true});
    for (const width of [390, 768, 1280]) {
      await referrer.page.setViewportSize({width, height: 900});
      await referrer.page.goto(`/${locale}/app/points`);
      await expect(referrer.page.locator('.points-referral-card')).toBeVisible();
      expect(await referrer.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await referrer.page.screenshot({path: `screenshots/C1/points-${locale}-${width}.png`, fullPage: true});
    }
  }
  await friendContext.close();
  await referrer.context.close();
});
