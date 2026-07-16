import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { createFmtConfig } from '@repo/vite-configs/fmt';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  run: {
    tasks: {
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
});
