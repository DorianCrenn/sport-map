import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 90000,
  reporter: [
    ['html', { outputFolder: 'e2e/reports/html', open: 'never' }],
    ['json', { outputFile: 'e2e/reports/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    // Mobile prioritaire (app mobile-first)
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iPhone 15',
      use: { ...devices['iPhone 15 Pro'] },
    },
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
    // Desktop
    {
      name: 'Desktop Chrome 1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Desktop Chrome 1920',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  snapshotDir: './e2e/screenshots',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
    },
  },
});
