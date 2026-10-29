import {mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {expect, test} from '@playwright/test';

// Review screenshots: every registered template at 390 / 768 / 1280 in Arabic and English.
// Saved to e2e/screenshots/C4/<slug>-<locale>-<width>.png (CI uploads them as an artifact; never commit them).
const WIDTHS = [390, 768, 1280] as const;
const LOCALES = ['ar', 'en'] as const;

function getRegisteredTemplateSlugs(): string[] {
  const registryPath = path.resolve(__dirname, '../../apps/web/src/templates/registry.ts');
  const content = readFileSync(registryPath, 'utf8');
  const match = content.match(/export const templates:\s*Record<string,\s*TemplateDefinition>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!match) throw new Error('Could not parse templates map from registry.ts');
  const body = match[1];
  const slugs: string[] = [];
  const keyRegex = /^[ \t]{2}['"]?([a-z0-9_-]+)['"]?:\s*\{/gm;
  let m: RegExpExecArray | null;
  while ((m = keyRegex.exec(body)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

const slugs = getRegisteredTemplateSlugs();

for (const slug of slugs) {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`template ${slug} at ${width}px in ${locale}`, async ({browser}) => {
        const context = await browser.newContext({
          viewport: {width, height: 900},
          locale: locale === 'ar' ? 'ar-EG' : 'en-US',
        });
        const page = await context.newPage();
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => {
          consoleErrors.push(err.message);
        });

        const response = await page.goto(`/${locale}/preview/${slug}`, {waitUntil: 'load'});
        expect(response?.status(), `${slug} preview responds 200`).toBe(200);

        // Fail on missing hero section
        const hero = page.locator('.hero-section');
        await expect(hero, `${slug} must render a visible hero section`).toBeVisible();

        // Check document direction
        const dir = await page.evaluate(() => document.documentElement.dir);
        expect(dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');

        // Fail on horizontal overflow (document.documentElement.scrollWidth > innerWidth)
        const overflow = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            isOverflowing: document.documentElement.scrollWidth > window.innerWidth,
          };
        });

        const screenshotDir = path.resolve(__dirname, '../screenshots/C4');
        mkdirSync(screenshotDir, {recursive: true});
        await page.screenshot({
          path: path.join(screenshotDir, `${slug}-${locale}-${String(width)}.png`),
          fullPage: true,
        });

        await context.close();

        expect(
          overflow.isOverflowing,
          `Template "${slug}" must not scroll horizontally at ${String(width)}px (${locale}). ` +
          `scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
        ).toBe(false);

        expect(consoleErrors, `Template "${slug}" must have no console errors at ${String(width)}px (${locale})`).toEqual([]);
      });
    }
  }
}
