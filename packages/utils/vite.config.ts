import { defineConfig } from 'vite-plus';

// Coverage flags are inlined rather than imported from `@repo/vite-configs/run`:
// vite-configs depends on @lcabrera/utils, so importing it back — even for a const —
// creates a workspace cycle that breaks every recursive `vp run -r` task graph
// (the same reason eslint.config.mjs imports its shared config by relative path).
// The reporter half mirrors VITEST_COVERAGE_FLAGS in packages/vite-configs; the
// threshold half is the 95% gate — @lcabrera/utils is public-facing (AGENTS.md §4),
// so any drop below 95% fails `test:coverage`.
const COVERAGE_FLAGS = [
  '--coverage',
  '--coverage.provider=v8',
  '--coverage.reporter=json',
  '--coverage.reporter=json-summary',
  '--coverage.reportsDirectory=coverage',
  '--coverage.thresholds.statements=95',
  '--coverage.thresholds.branches=95',
  '--coverage.thresholds.functions=95',
  '--coverage.thresholds.lines=95',
].join(' ');

export default defineConfig({
  run: {
    tasks: {
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${COVERAGE_FLAGS}`,
      },
    },
  },
});
