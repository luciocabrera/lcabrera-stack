import { createFmtConfig } from '@repo/vite-configs/fmt';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();

export default defineConfig({
  fmt: fmtConfig,
  resolve: {
    alias: {
      '@repo/agent-runner': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  run: {
    tasks: {
      test: {
        cache: false,
        command: 'node node_modules/vitest/vitest.mjs run',
      },
      // Feeds the PR Coverage Report comment. Everything under test here is a
      // pure util — path guards, frontmatter parsing, tool derivation — so the
      // task touches no process, network or service.
      //
      // Read the resulting number narrowly: the shared flags do not pass
      // `--coverage.all`, so v8 measures only files a test imported.
      // `runSkillAgent.ts` and `index.ts` have no tests and are therefore
      // absent from the report rather than counted as uncovered, which is why
      // this package reads ~100%. That behaviour is repo-wide, not specific to
      // this workspace.
      'test:coverage': {
        cache: false,
        command: `node node_modules/vitest/vitest.mjs run ${VITEST_COVERAGE_FLAGS}`,
      },
    },
  },
});
