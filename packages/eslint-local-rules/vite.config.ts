import { defineConfig } from 'vite-plus';

// Both blocks below are inlined rather than imported from `@repo/vite-configs`:
// vite-configs depends on this package for the custom rules, so importing it
// back — even for a const — creates a workspace cycle that breaks every
// recursive `vp run -r` task graph. @lcabrera/utils inlines the same two blocks for
// the same reason; see packages/vite-configs/vite.pack.shared.config.ts for why
// these packages are built at all rather than shipping source.
const COVERAGE_FLAGS = [
  '--coverage',
  '--coverage.provider=v8',
  '--coverage.reporter=json',
  '--coverage.reporter=json-summary',
  '--coverage.reportsDirectory=coverage',
].join(' ');

export default defineConfig({
  // Mirrors createPackConfig in packages/vite-configs. Replaces the bespoke
  // `tsc -p tsconfig.build.json` this package used to run, which emitted `.js`
  // to `build/` — the wrong extension and the wrong directory for the published
  // surface the gates check (`.mjs`/`.d.mts` under `dist/`).
  pack: {
    dts: { tsconfig: 'tsconfig.app.json' },
    entry: ['src/**/*.ts', '!src/**/*.test.ts'],
    sourcemap: true,
    unbundle: true,
  },
  run: {
    tasks: {
      // `--passWithNoTests` was correct while this package had no suites. It
      // has had them since #205 ("test every custom rule, revive a dead one"),
      // and the flag would only mean the suite disappearing still reports
      // success. Dropped so an empty run fails instead.
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      // Feeds the PR Coverage Report comment. Each rule is exercised through
      // RuleTester against source strings, so nothing here reaches a process,
      // a network or a service.
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${COVERAGE_FLAGS}`,
      },
    },
  },
});
