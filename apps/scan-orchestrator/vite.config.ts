import { createApiLintConfig } from '@repo/vite-configs/api-lint';
import { createFmtConfig } from '@repo/vite-configs/fmt';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();
const lintConfig = createApiLintConfig();

const VITEST = 'node_modules/vitest/vitest.mjs';

/** Loads DB_* so the real-Postgres suite can connect. */
const WITH_DB_ENV =
  'node --env-file-if-exists=../../docker/local/.env --env-file-if-exists=.env';

/**
 * The one suite that needs a live CQMS Postgres: `runQueuedScan` drives the
 * real scan queue through `getPool()`. Everything else here (`ws/`) is a plain
 * WebSocket/hub test and runs anywhere.
 *
 * Same split, and same reason, as `@repo/scan-ingestion`: without it the whole
 * workspace has to be excluded from the DB-free CI run, which silently drops
 * the `ws/` tests too.
 *
 * vitest's --exclude replaces the built-in defaults, so those are restated —
 * without them vitest would descend into node_modules.
 */
const UNIT_ONLY = [
  '**/node_modules/**',
  '**/dist/**',
  'src/queue/runQueuedScan.test.ts',
]
  .map((pattern) => `--exclude '${pattern}'`)
  .join(' ');

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  run: {
    tasks: {
      // The full suite — needs Postgres. Kept as `test` so `vp run test:all`
      // still covers everything.
      test: {
        cache: false,
        command: `${WITH_DB_ENV} ${VITEST} run`,
      },
      // DB-free subset + Istanbul coverage — what the fallow audit consumes.
      'test:coverage': {
        cache: false,
        command: `node ${VITEST} run ${UNIT_ONLY} ${VITEST_COVERAGE_FLAGS}`,
      },
      // DB-free subset — runs with no database at all.
      'test:unit': {
        cache: false,
        command: `node ${VITEST} run ${UNIT_ONLY}`,
      },
    },
  },
});
