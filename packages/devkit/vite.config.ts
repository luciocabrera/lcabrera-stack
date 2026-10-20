import { VITEST_COVERAGE_FLAGS } from '@lcabrera/vite-config/run';
import { defineConfig } from 'vite-plus';

export default defineConfig({
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
  test: {
    exclude: ['assets/**', 'node_modules/**'],
  },
});
