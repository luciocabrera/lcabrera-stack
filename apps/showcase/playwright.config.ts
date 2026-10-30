import { defineConfig, devices } from '@playwright/test';

import { evalsE2eServer } from './e2e/evals/evalsDatabase';

const isCi = process.env.CI === 'true' || process.env.CI === '1';
const port = isCi ? 3000 : 4173;
const emptyPort = isCi ? 3100 : 4174;
const brokenPort = isCi ? 3200 : 4175;
const reportRoot = '../../.tmp/playwright';
const evalsServer = evalsE2eServer();
const EMPTY_EVALS_SPEC = /evals\/empty\.spec\.ts$/u;
const BROKEN_EVALS_SPEC = /evals\/broken\.spec\.ts$/u;

const webServer = (args: {
  readonly database: 'empty' | 'missing' | 'seeded';
  readonly port: number;
}) => ({
  command: isCi
    ? 'vp exec react-router-serve build/server/index.js'
    : `vp exec react-router dev --host 127.0.0.1 --port ${String(args.port)} --strictPort`,
  env: {
    EVALS_DASHBOARD: '1',
    EVALS_READER_DATABASE_URL: evalsServer.readerUrlOf(args.database),
    PORT: String(args.port),
  },
  reuseExistingServer: false,
  timeout: 180_000,
  url: `http://127.0.0.1:${String(args.port)}`,
});

export default defineConfig({
  expect: { timeout: 45_000 },
  fullyParallel: false,
  globalSetup: './e2e/global-setup.ts',
  outputDir: `${reportRoot}/results`,
  projects: [
    {
      name: 'chromium',
      testIgnore: [EMPTY_EVALS_SPEC, BROKEN_EVALS_SPEC],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { height: 900, width: 1440 },
      },
    },
    {
      name: 'evals-empty',
      testMatch: EMPTY_EVALS_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${String(emptyPort)}`,
        viewport: { height: 900, width: 1440 },
      },
    },
    {
      name: 'evals-broken',
      testMatch: BROKEN_EVALS_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${String(brokenPort)}`,
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
  webServer: [
    webServer({ database: 'seeded', port }),
    webServer({ database: 'empty', port: emptyPort }),
    webServer({ database: 'missing', port: brokenPort }),
  ],
  workers: 1,
});
