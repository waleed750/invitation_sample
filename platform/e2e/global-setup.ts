import {mkdirSync} from 'node:fs';
import {chromium, type FullConfig} from '@playwright/test';
import {SEED, signIn} from './helpers';

/** Signs the seeded admin and customer in once; the screenshot suite reuses the saved sessions. */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000';
  mkdirSync('.auth', {recursive: true});
  const browser = await chromium.launch();
  try {
    for (const [name, email, next] of [
      ['admin', SEED.admin, '/ar/admin'],
      ['customer', SEED.customer, '/ar/app'],
    ] as const) {
      const context = await browser.newContext({baseURL, locale: 'ar-EG'});
      const page = await context.newPage();
      await signIn(page, email, next);
      await context.storageState({path: `.auth/${name}.json`});
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
