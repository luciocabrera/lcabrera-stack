import { VITEST_COVERAGE_FLAGS } from '@lcabrera/vite-config/run';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

import { fmtConfig } from './config/vite.fmt.config.ts';
import { pluginsConfig } from './config/vite.plugins.config.ts';

export default defineConfig({
  fmt: fmtConfig,
  plugins: pluginsConfig,
  resolve: {
    alias: {
      // Self-referencing alias, same mechanism (and same reason) as every
      // consuming app's own '@lcabrera/ui' resolve.alias entry — real Node
      // package-exports resolution doesn't apply here (no exports map), and
      // tsconfig `paths` alone only helps tsc/editors, not
      // Vite/Vitest's own bundler-level resolution.
      '@lcabrera/ui': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  run: {
    tasks: {
      // Deliberately NOT in any gate: benchmark timings are noisy on shared CI
      // runners, so this is a decision-making tool run on demand. Vitest's
      // default `benchmark.include` matches `*.bench.ts` while its test
      // `include` matches only `*.{test,spec}.*`, so `test` below never picks
      // these up — see src/benchmarks/ARCHITECTURE.md.
      bench: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs bench --run',
      },
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      // Feeds scripts/merge-coverage.mjs, which feeds `fallow audit --coverage`.
      // Matters more here than elsewhere: packages/ui is heading for public
      // release, so its complexity findings should gate on measured coverage
      // rather than fallow's colocated-test-file guess.
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
  test: {
    setupFiles: ['./src/utils/tests/vitest.setup.ts'],
  },
});
