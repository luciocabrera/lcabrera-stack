import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

const lintConfig = createApiLintConfig();

const VITEST = 'node node_modules/vitest/vitest.mjs';

export default defineConfig({
  lint: lintConfig,
  run: {
    tasks: {
      build: {
        cache: true,
        command: 'tsc -p tsconfig.json',
      },
      test: {
        cache: false,
        command: `${VITEST} run`,
      },
      // No DB-free split needed here, unlike scan-ingestion/scan-orchestrator:
      // every suite in this workspace injects its dependencies (the distinct
      // repository test passes a pool mock), so the whole set runs with no
      // database at all. Verified by running it with the DB_* variables unset.
      'test:coverage': {
        cache: false,
        command: `${VITEST} run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
