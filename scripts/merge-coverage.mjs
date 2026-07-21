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
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { readWorkspaceGraph, resolveAffected } from './lib/affected-tests.mjs';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUTPUT_PATH = join(
  REPO_ROOT,
  'reports/fallow/coverage/coverage-final.json',
);

// The workspace's own vp shim by absolute path — never a bare `vp` off $PATH
// (the Sonar S4036 hotspot). `vp install` always provides it.
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

/**
 * Workspaces whose `test:coverage` task runs without a database, a browser
 * beyond jsdom, or any other external service.
 *
 * Opt-in by design: an earlier attempt at this lever was reverted (2026-07-14)
 * for pulling in a suite that needed Postgres, so a new workspace is added here
 * only once its coverage task is known to run clean without one.
 *
 * Deliberately absent:
 * - `vite-react-compiler` (apps/react-router) — the showcase app. Its fallow
 *   findings are baselined, so coverage buys the gate nothing today, and its
 *   suite is the largest in the repo. Add it if showcase findings ever gate.
 */
const COVERAGE_WORKSPACES = [
  { dir: 'packages/api', name: '@repo/api' },
  { dir: 'packages/node-runtime', name: '@repo/node-runtime' },
  { dir: 'packages/scan-ingestion', name: '@repo/scan-ingestion' },
  { dir: 'packages/server', name: '@repo/server' },
  { dir: 'packages/ui', name: '@repo/ui' },
  { dir: 'packages/utils', name: '@repo/utils' },
  { dir: 'apps/admin_system', name: 'admin-system' },
  { dir: 'apps/scan-orchestrator', name: '@repo/scan-orchestrator' },
];

const shouldRun = !process.argv.includes('--no-run');
const changedOnly = process.argv.includes('--changed');

/**
 * The workspaces to measure. With `--changed`, scopes to the covered workspaces
 * a diff (paths on stdin) DIRECTLY changed — so the fallow job stops running
 * coverage for workspaces the change never touched. The audit is new-only (it
 * scores only the diff's own files), so only a directly-changed workspace's
 * coverage is ever consulted; dependents don't need it. A root/shared change
 * (mode `full`) keeps the whole set.
 */
const targetWorkspaces = () => {
  if (!changedOnly) {
    return COVERAGE_WORKSPACES;
  }
  const files = readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const { mode, changed } = resolveAffected({
    files,
    graph: readWorkspaceGraph(REPO_ROOT),
  });
  if (mode === 'full') {
    return COVERAGE_WORKSPACES;
  }
  const changedSet = new Set(changed);
  return COVERAGE_WORKSPACES.filter((workspace) =>
    changedSet.has(workspace.name),
  );
};

const runCoverage = async ({ dir, name }) => {
  process.stdout.write(`• ${name} — running test:coverage…\n`);
  try {
    await execFileAsync(VP_BIN, ['run', '--filter', name, 'test:coverage'], {
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
const mergeCoverage = (reports) => Object.assign({}, ...reports);

const writeMerged = async (merged) => {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(merged)}\n`);
};

const main = async () => {
  const workspaces = targetWorkspaces();

  // Scoped run that touched no covered workspace: still write an empty (valid)
  // coverage file so `fallow audit --coverage` has an input and falls back to
  // estimation for the diff's files. Nothing to measure is a success.
  if (changedOnly && workspaces.length === 0) {
    await writeMerged({});
    process.stdout.write(
      'coverage: no covered workspace changed — wrote empty coverage-final.json.\n',
    );
    return;
  }

  if (shouldRun) {
    for (const workspace of workspaces) {
      await runCoverage(workspace);
    }
  }

  const reports = await Promise.all(
    workspaces.map((workspace) => readWorkspaceCoverage(workspace)),
  );
  const merged = mergeCoverage(reports);
  await writeMerged(merged);

  const fileCount = Object.keys(merged).length;
  process.stdout.write(
    `\n✔ merged ${fileCount} files from ${workspaces.length} workspace(s) → reports/fallow/coverage/coverage-final.json\n` +
      `  feed it to the gate: vp run fallow:audit --base origin/main --coverage reports/fallow/coverage/coverage-final.json\n`,
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
}
