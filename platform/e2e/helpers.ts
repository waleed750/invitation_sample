import {expect, type APIRequestContext, type Browser, type BrowserContext, type Page} from '@playwright/test';

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';

/** Reads the sign-in code the API captured for an address (E2E_CAPTURE_EMAILS=1). */
export async function latestCode(request: APIRequestContext, email: string, notBefore?: string): Promise<string> {
  let code = '';
  await expect
    .poll(
      async () => {
        const response = await request.get(`${API_URL}/v1/__e2e/last-code`, {params: {email}});
        if (!response.ok()) return '';
        code = ((await response.json()) as {code: string}).code;
        return code === notBefore ? '' : code;
      },
      {message: `sign-in code for ${email}`, timeout: 15_000},
    )
    .not.toBe('');
  return code;
}

/** Signs in through the real sign-in form (email code) and waits to land on `next`. */
export async function signIn(page: Page, email: string, next: string, locale: 'ar' | 'en' = 'ar'): Promise<void> {
  const before = await page.request
    .get(`${API_URL}/v1/__e2e/last-code`, {params: {email}})
    .then(async (r) => (r.ok() ? ((await r.json()) as {code: string}).code : undefined));
  await page.goto(`/${locale}/sign-in?next=${encodeURIComponent(next)}`);
  await page.locator('input[type=email]').fill(email);
  await page.locator('form button[type=submit]').click();
  const codeInput = page.locator('input[autocomplete=one-time-code]');
  await expect(codeInput).toBeVisible();
  await codeInput.fill(await latestCode(page.request, email, before));
  await page.locator('form button[type=submit]').click();
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'));
}

export async function newSignedInContext(browser: Browser, email: string, next: string): Promise<{context: BrowserContext; page: Page}> {
  const context = await browser.newContext({locale: 'ar-EG'});
  const page = await context.newPage();
  await signIn(page, email, next);
  return {context, page};
}

export const SEED = {
  admin: 'admin@example.test',
  customer: 'customer1@example.test',
  publishedSlug: 'demo-nour-omar',
} as const;
