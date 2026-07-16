import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { createFmtConfig } from '@repo/vite-configs/fmt';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
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
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
