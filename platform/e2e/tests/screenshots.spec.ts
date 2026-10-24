import {mkdirSync} from 'node:fs';
import {expect, test} from '@playwright/test';
import {SEED} from '../helpers';

// Review screenshots: every route at 390 / 768 / 1280 in Arabic and English.
// Saved to e2e/screenshots/<task>/<page>-<locale>-<width>.png (CI uploads them as an artifact; never commit them).
// Each shot also asserts there is no horizontal scroll.
const TASK = process.env.E2E_SCREENSHOT_TASK ?? 'T01';
const WIDTHS = [390, 768, 1280] as const;
const LOCALES = ['ar', 'en'] as const;

type Route = {name: string; path: string; auth?: 'admin' | 'customer'; settle?: string};

const ROUTES: Route[] = [
  {name: 'home', path: ''},
  {name: 'templates', path: '/templates'},
  {name: 'pricing', path: '/pricing'},
  {name: 'sign-in', path: '/sign-in'},
  {name: 'public-invitation', path: `/i/${SEED.publishedSlug}`},
  {name: 'pick-preview', path: '/pick-preview/mashrabiya?first=Sara&second=Ali&date=2027-06-15'},
  {name: 'customer-dashboard', path: '/app', auth: 'customer'},
  {name: 'customer-new', path: '/app/new', auth: 'customer'},
  {name: 'customer-orders', path: '/app/orders', auth: 'customer'},
  {name: 'customer-points', path: '/app/points', auth: 'customer'},
  {name: 'customer-account', path: '/app/account', auth: 'customer'},
  {name: 'customer-media', path: '/app/media', auth: 'customer'},
  {name: 'customer-balance', path: '/app/balance', auth: 'customer'},
  {name: 'checkout', path: '/checkout/mashrabiya?tier=classic&names=Sara+%26+Ali&date=2027-06-15', auth: 'customer'},
  {name: 'admin-overview', path: '/admin', auth: 'admin'},
  {name: 'admin-payments', path: '/admin/payments', auth: 'admin'},
  {name: 'admin-payment-events', path: '/admin/payment-events', auth: 'admin'},
  {name: 'admin-customers', path: '/admin/customers', auth: 'admin'},
  {name: 'admin-audit', path: '/admin/audit', auth: 'admin'},
];

for (const route of ROUTES) {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`${route.name} ${locale} ${String(width)}`, async ({browser}) => {
        const context = await browser.newContext({
          viewport: {width, height: 900},
          locale: locale === 'ar' ? 'ar-EG' : 'en-US',
          ...(route.auth ? {storageState: `.auth/${route.auth}.json`} : {}),
        });
        const page = await context.newPage();
        const response = await page.goto(`/${locale}${route.path}`);
        expect(response?.status(), `${route.path} responds`).toBeLessThan(400);
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const dir = await page.evaluate(() => document.documentElement.dir);
        expect(dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');

        mkdirSync(`screenshots/${TASK}`, {recursive: true});
        await page.screenshot({path: `screenshots/${TASK}/${route.name}-${locale}-${String(width)}.png`, fullPage: true});
        await context.close();
        expect(overflow, `${route.path} must not scroll horizontally at ${String(width)}px`).toBeLessThanOrEqual(0);
      });
    }
  }
}
