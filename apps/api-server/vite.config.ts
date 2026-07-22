import { createFmtConfig } from '@repo/vite-configs/fmt';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();

export default defineConfig({
  fmt: fmtConfig,
  run: {
    tasks: {
      build: {
        cache: true,
        command: 'tsc -p tsconfig.json',
        dependsOn: [{ from: 'dependencies', task: 'build' }],
      },
      test: {
        cache: false,
        command:
          'node --env-file-if-exists=../../docker/local/.env --env-file-if-exists=.env node_modules/vitest/vitest.mjs run',
        // `api-shared` resolves through its exports map to ./dist/index.js, so
        // it has to be compiled before anything imports it — including tests.
        // Without this, `vp run test:ci` (which never runs a build) fails with
        // "Failed to resolve entry for package api-shared" on a fresh checkout.
        dependsOn: [{ from: 'dependencies', task: 'build' }],
      },
      // Deliberately loads no environment file: every suite here injects its
      // dependencies (controllers take a repository, readEnvConfig takes a
      // plain object), so none of them opens a connection. Running without the
      // DB_* variables is what proves that, and it keeps the number the CI job
      // reports honest — the `unit-tests` job has no database either.
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
        dependsOn: [{ from: 'dependencies', task: 'build' }],
      },
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
