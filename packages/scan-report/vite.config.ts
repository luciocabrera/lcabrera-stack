import { createFmtConfig } from '@repo/vite-configs/fmt';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();

export default defineConfig({
  fmt: fmtConfig,
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
