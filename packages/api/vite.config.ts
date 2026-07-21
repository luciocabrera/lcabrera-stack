import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

// The reporter half comes from @repo/vite-configs so it cannot drift from the
// rest of the repo. Only the threshold half is local: @lcabrera/api is public-facing
// (AGENTS.md §4), so any drop below 95% fails `test:coverage`.
//
// @lcabrera/utils inlines both halves instead, because vite-configs depends on
// @lcabrera/utils and importing it back would create a workspace cycle. @lcabrera/api is
// not in that cycle, so it imports rather than copies.
const COVERAGE_THRESHOLD_FLAGS = [
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
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS} ${COVERAGE_THRESHOLD_FLAGS}`,
      },
    },
  },
});
