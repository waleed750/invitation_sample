import {defineConfig, devices} from '@playwright/test';

const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  // The journey is one long, ordered story; screenshots are independent.
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {timeout: 15_000},
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]] : [['list']],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ar-EG',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: [
    {
      command: 'bash ../scripts/e2e-serve.sh api',
      url: 'http://localhost:3001/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'bash ../scripts/e2e-serve.sh web',
      url: `${webUrl}/ar`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
