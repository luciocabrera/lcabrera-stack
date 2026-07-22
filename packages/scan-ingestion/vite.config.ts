import { createFmtConfig } from '@repo/vite-configs/fmt';
import { VITEST_COVERAGE_FLAGS } from '@repo/vite-configs/run';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

const fmtConfig = createFmtConfig();

const VITEST = 'node_modules/vitest/vitest.mjs';

/** Loads DB_* so the real-Postgres suites can connect. */
const WITH_DB_ENV =
  'node --env-file-if-exists=../../docker/local/.env --env-file-if-exists=.env';

/**
 * Everything that needs a live CQMS Postgres: every `queries/*` suite plus
 * `ingestReport`, which writes a real report. The rest of the package —
 * `ingestion/` (fallow, appGraph, lint), `auth/`, `fs/`, `cli/` — is pure and
 * runs anywhere.
 *
 * Excluding these is the whole point of the split: it lets the fallow audit
 * job measure real coverage without provisioning a database. The previous
 * attempt to feed coverage into the audit was reverted (2026-07-14) precisely
 * because it ran these suites in CI, where `getPool()` → `readEnvConfig()`
 * throws on the missing `DB_*`. Keep `test:coverage` DB-free.
 *
 * vitest's --exclude replaces the built-in defaults, so those are restated —
 * without them vitest would descend into node_modules.
 */
const UNIT_ONLY = [
  '**/node_modules/**',
  '**/dist/**',
  'src/queries/**',
  'src/ingestion/ingestReport.test.ts',
  'src/db/migrations/**', // 0029 pin-run-to-snapshot integration test — needs a live DB
]
  .map((pattern) => `--exclude '${pattern}'`)
  .join(' ');

export default defineConfig({
  fmt: fmtConfig,
  resolve: {
    alias: {
      '@repo/scan-ingestion': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  run: {
    tasks: {
      // The full suite — needs Postgres. Kept as `test` so `vp run test:all`
      // still covers everything.
      //
      // There is deliberately no `test:integration` counterpart to `test:unit`:
      // the DB suites are order- and state-coupled, so running them as a subset
      // fails (listApiTokens / failStaleRunningScans go red in isolation but
      // pass inside the full run, whichever order vitest picks). Until that
      // coupling is fixed, the real-Postgres suites are only trustworthy via
      // this full `test` task.
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
