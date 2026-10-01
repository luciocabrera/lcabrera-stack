import { defineConfig, devices } from '@playwright/test';

const isCi = process.env.CI === 'true' || process.env.CI === '1';
const port = isCi ? 3000 : 4173;
const reportRoot = '../../.tmp/playwright';

export default defineConfig({
  expect: { timeout: 45_000 },
  fullyParallel: false,
  globalSetup: './e2e/global-setup.ts',
  outputDir: `${reportRoot}/results`,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { height: 900, width: 1440 },
      },
    },
  ],
  reporter: isCi
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: `${reportRoot}/html` }],
      ]
    : [['list']],
  retries: isCi ? 2 : 0,
  testDir: './e2e',
  timeout: 120_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: isCi
      ? 'vp exec react-router-serve build/server/index.js'
      : 'vp exec react-router dev --host 127.0.0.1 --port 4173 --strictPort',
    reuseExistingServer: false,
    timeout: 180_000,
    url: `http://127.0.0.1:${port}`,
  },
  workers: 1,
});
