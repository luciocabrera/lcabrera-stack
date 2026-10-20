import { createPackConfig } from '@lcabrera/vite-config/pack';
import { VITEST_COVERAGE_FLAGS } from '@lcabrera/vite-config/run';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: createPackConfig(),
  run: {
    tasks: {
      test: {
        cache: false,
        command: 'vp test run',
      },
      'test:coverage': {
        cache: false,
        command: `vp test run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
});
