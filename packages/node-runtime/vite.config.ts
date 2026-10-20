import { createPackConfig } from '@lcabrera/vite-config/pack';
import { VITEST_COVERAGE_FLAGS } from '@lcabrera/vite-config/run';
import { defineConfig } from 'vite-plus';

export default defineConfig({
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
