import { createFmtConfig } from '@repo/vite-configs/fmt';
import { createPackConfig } from '@repo/vite-configs/pack';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();

export default defineConfig({
  fmt: fmtConfig,
  pack: createPackConfig(),
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
