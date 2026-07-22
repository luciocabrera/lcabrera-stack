import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {
        cache: true,
        command: 'tsc -p tsconfig.build.json',
        // Exclude emitted JS from the input fingerprint — tsc writes to build/,
        // and tracking its own output as an input causes guaranteed cache misses.
        input: [{ auto: true }, '!build/**'],
      },
      // `--passWithNoTests` was correct while this package had no suites. It
      // has had them since #205 ("test every custom rule, revive a dead one"),
      // and with 10 files the flag only means the suite disappearing would
      // still report success. Dropped so an empty run fails instead.
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      // Feeds the PR Coverage Report comment. Each rule is exercised through
      // RuleTester against source strings, so nothing here reaches a process,
      // a network or a service.
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
});
