/**
 * Runs the DB-free coverage suites and merges their Istanbul reports into the
 * single file the fallow audit gate consumes:
 *
 *   reports/fallow/coverage/coverage-final.json
 *
 * (Under reports/fallow/ per the canonical fallow output convention; the
 * `coverage/` segment means the repo's existing .gitignore rule already
 * ignores it — it is a build product, not a tracked report snapshot.)
 *
 * WHY THIS EXISTS
 * ---------------
 * `fallow audit` scores CRAP as `cyclomatic² × (1 − coverage)³ + cyclomatic`
 * against a threshold of 30. Given no coverage data it *estimates* coverage
 * from whether a colocated test file exists (none → 0%, partial → 40%), so
 * every function with cyclomatic ≥ 5 and no colocated test breaches the
 * threshold on complexity it does not actually have. Feeding real coverage via
 * `fallow audit --coverage <this file>` replaces the guess with measurement.
 *
 * ONLY DB-FREE SUITES RUN HERE. An earlier attempt to feed coverage into the
 * audit was reverted (2026-07-14) because it ran scan-ingestion's real-Postgres
 * `queries/*` tests in CI, where `getPool()` → `readEnvConfig()` throws on the
 * missing `DB_*`. scan-ingestion's `test:coverage` task is the DB-free subset
 * for exactly this reason — see packages/scan-ingestion/vite.config.ts.
 *
 * Usage (from the repo root):
 *   vp run coverage:merge                  # run suites + merge
 *   node scripts/merge-coverage.mjs        # same, direct
 *   node scripts/merge-coverage.mjs --no-run   # merge already-generated reports
 *
 * Exit codes: 0 = merged report written, 1 = a suite failed or produced no
 * coverage (a partial merge is worse than none — it would silently score
 * uncovered files as 0% and fail the gate on phantom complexity).
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUTPUT_PATH = join(
  REPO_ROOT,
  'reports/fallow/coverage/coverage-final.json',
);

/**
 * Workspaces whose `test:coverage` task runs without a database, a browser
 * beyond jsdom, or any other external service.
 *
 * Deliberately absent:
 * - `@repo/ui` — its suite is currently red (missing ThemeProvider wrappers in
 *   Modal/drawer test trees); add it once green.
 * - `vite-react-compiler` (apps/react-router) — the showcase app. Its fallow
 *   findings are baselined, so coverage buys the gate nothing today, and its
 *   suite is the largest in the repo. Add it if showcase findings ever gate.
 */
const COVERAGE_WORKSPACES = [
  { dir: 'packages/data-access', name: '@repo/data-access' },
  { dir: 'packages/node-runtime', name: '@repo/node-runtime' },
  { dir: 'packages/scan-ingestion', name: '@repo/scan-ingestion' },
  { dir: 'apps/admin_system', name: 'admin-system' },
];

const shouldRun = !process.argv.includes('--no-run');

const runCoverage = async ({ dir, name }) => {
  process.stdout.write(`• ${name} — running test:coverage…\n`);
  try {
    await execFileAsync('vp', ['run', '--filter', name, 'test:coverage'], {
      cwd: REPO_ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(
      `${name}: test:coverage failed — the merged report would be incomplete.\n${error.stdout ?? ''}${error.stderr ?? ''}`,
    );
  }
  return { dir, name };
};

const readWorkspaceCoverage = async ({ dir, name }) => {
  const path = join(REPO_ROOT, dir, 'coverage/coverage-final.json');
  if (!existsSync(path)) {
    throw new Error(
      `${name}: no coverage at ${dir}/coverage/coverage-final.json. Run without --no-run, or check that its test:coverage task emits the json reporter.`,
    );
  }
  return JSON.parse(await readFile(path, 'utf8'));
};

/**
 * Istanbul keys every entry by absolute source path, so entries from different
 * workspaces never collide and a shallow merge is exactly right.
 */
const mergeCoverage = (reports) =>
  reports.reduce((merged, report) => ({ ...merged, ...report }), {});

const main = async () => {
  if (shouldRun) {
    for (const workspace of COVERAGE_WORKSPACES) {
      await runCoverage(workspace);
    }
  }

  const reports = await Promise.all(
    COVERAGE_WORKSPACES.map((workspace) => readWorkspaceCoverage(workspace)),
  );
  const merged = mergeCoverage(reports);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(merged)}\n`);

  const fileCount = Object.keys(merged).length;
  process.stdout.write(
    `\n✔ merged ${fileCount} files from ${COVERAGE_WORKSPACES.length} workspaces → reports/fallow/coverage/coverage-final.json\n` +
      `  feed it to the gate: vp run fallow:audit --base origin/main --coverage reports/fallow/coverage/coverage-final.json\n`,
  );
};

main().catch((error) => {
  process.stderr.write(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
});
