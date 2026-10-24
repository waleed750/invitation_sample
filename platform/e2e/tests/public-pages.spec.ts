import {expect, test} from '@playwright/test';

// T20: ended invitation, legal pages, 404 and error pages.
test('an invitation whose online period is over shows the ended page, not a 404', async ({page}) => {
  const response = await page.goto('/ar/i/demo-hoda-tarek');
  expect(response?.status()).toBe(200);
  const ended = page.getByTestId('invitation-ended');
  await expect(ended).toBeVisible();
  await expect(ended).toContainText('هدى');
  await expect(ended).toContainText('طارق');
  await expect(ended).toContainText('انتهت');
  await expect(ended.getByRole('link', {name: 'أنشئوا دعوتكم'})).toHaveAttribute('href', /\/ar\/templates/);

  await page.goto('/en/i/demo-hoda-tarek');
  await expect(page.getByTestId('invitation-ended')).toContainText('has ended');
});

for (const locale of ['ar', 'en'] as const) {
  for (const doc of ['terms', 'privacy', 'refund'] as const) {
    test(`legal page /${locale}/${doc} exists, is marked as a draft, and sets the document direction`, async ({page}) => {
      const response = await page.goto(`/${locale}/${doc}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId('legal-draft')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(await page.locator('section').count()).toBeGreaterThanOrEqual(6);
    });
  }
}

test('the privacy page states the PDPL points: what is stored, the 30-day phone purge and how to request deletion', async ({page}) => {
  await page.goto('/en/privacy');
  const text = await page.locator('article').innerText();
  expect(text).toContain('151 of 2020');
  expect(text).toMatch(/30 days/);
  expect(text).toMatch(/delete/i);
  await page.goto('/ar/privacy');
  const arabic = await page.locator('article').innerText();
  expect(arabic).toContain('151');
  expect(arabic).toContain('30 يومًا');
});

test('unknown pages show the branded 404 with a way home, and leak nothing', async ({page}) => {
  for (const path of ['/ar/this-page-does-not-exist', '/en/also/not/here', '/ar/i/no-such-invitation-xyz']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    const box = page.getByTestId('not-found');
    await expect(box).toBeVisible();
    await expect(box.getByRole('link')).toHaveAttribute('href', /\/(ar|en)\/?$/);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/stack|node_modules|at .*\(.*:\d+:\d+\)/i);
  }
});

test('the footer links to the legal pages', async ({page}) => {
  await page.goto('/ar');
  for (const doc of ['terms', 'privacy', 'refund']) {
    await expect(page.locator(`footer a[href="/ar/${doc}"]`)).toBeVisible();
  }
});
