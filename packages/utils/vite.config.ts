import { createPackConfig } from '@lcabrera/vite-config/pack';
import { VITEST_COVERAGE_FLAGS } from '@lcabrera/vite-config/run';
import { defineConfig } from 'vite-plus';

// Both blocks were inlined while @lcabrera/vite-config declared @lcabrera/utils
// as a devDependency and importing it back would have closed a workspace cycle.
// ADR-069 dropped that edge — the config package has no import site for it — so
// the shared values are imported again. The 95% thresholds stay local: they are
// this package's own gate (@lcabrera/utils is public-facing, AGENTS.md §4), not
// something every workspace shares.
const COVERAGE_FLAGS = [
  VITEST_COVERAGE_FLAGS,
  '--coverage.thresholds.statements=95',
  '--coverage.thresholds.branches=95',
  '--coverage.thresholds.functions=95',
  '--coverage.thresholds.lines=95',
].join(' ');

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
        command: `node node_modules/vitest/vitest.mjs run ${COVERAGE_FLAGS}`,
      },
    },
  },
});
