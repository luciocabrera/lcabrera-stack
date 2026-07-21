/**
 * Builds the per-workspace + monorepo coverage summary the CI "Coverage Report"
 * PR comment renders:
 *
 *   coverage/monorepo-coverage-summary.json
 *
 * (Under the repo-root `coverage/` dir, which .gitignore already ignores — it is
 * a build product, regenerated every run, never a tracked snapshot.)
 *
 * WHY THIS EXISTS
 * ---------------
 * The coverage comment used to read a single workspace's `coverage-summary.json`
 * (react-router's, because `test:ci` runs its coverage last), so the PR only ever
 * saw one app's numbers with no label. This collects each reported workspace's
 * own `coverage-summary.json`, tags it with the project name, and aggregates a
 * monorepo-wide total, so the comment shows one row per workspace plus a total.
 *
 * WHY A SEPARATE SCRIPT FROM merge-coverage.mjs
 * ---------------------------------------------
 * merge-coverage.mjs feeds the *fallow gate* — detailed `coverage-final.json`,
 * DB-free workspaces only, and react-router is deliberately excluded (its suite
 * is the largest and its fallow findings are baselined, so coverage buys that
 * gate nothing). This feeds the *PR comment* — per-workspace `coverage-summary`
 * totals for the public-facing surfaces, which explicitly include react-router.
 * Different workspace sets, different inputs, different consumers; coupling them
 * would drag react-router into the fallow merge it is meant to stay out of.
 *
 * ROLLOUT
 * -------
 * COVERAGE_REPORT_WORKSPACES starts with the three most critical public-facing
 * surfaces. The phased plan for adding the rest (packages first) lives in
 * docs/tooling/coverage-reporting.md.
 *
 * Usage (from the repo root):
 *   vp run coverage:report              # run test:coverage for `run:true` workspaces, read the rest, aggregate
 *   node scripts/coverage-report.mjs    # same, direct
 *   node scripts/coverage-report.mjs --all       # also run react-router's test:coverage (standalone local use)
 *   node scripts/coverage-report.mjs --no-run     # aggregate already-generated summaries only, run nothing
 *   git diff --name-only BASE | node scripts/coverage-report.mjs --changed  # only workspaces a diff affected (CI PRs)
 *
 * Best-effort by design: a workspace whose coverage is missing or whose suite
 * fails is warned about and skipped, not fatal — the actual test gate is
 * `test:ci`, and a partial coverage comment is more useful than none. It exits
 * non-zero only when it can produce no report at all.
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
const OUTPUT_PATH = join(REPO_ROOT, 'coverage/monorepo-coverage-summary.json');

// The workspace's own vp shim by absolute path — never a bare `vp` off $PATH
// (the Sonar S4036 hotspot). `vp install` always provides it.
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

/** The four metrics Istanbul's json-summary exposes on `.total` that we report. */
const METRICS = ['lines', 'statements', 'functions', 'branches'];

/**
 * Workspaces whose coverage the PR comment reports, most-critical first.
 *
 * `run: true`  — this script runs its `test:coverage` (it runs plain `test`
 *                during `test:ci`, so no summary exists yet).
 * `run: false` — its `coverage-summary.json` is already produced upstream
 *                (react-router emits it from its own `test:ci`, and re-running
 *                the repo's largest suite here would be wasteful). `--all`
 *                overrides this for standalone local runs where `test:ci` has
 *                not run first.
 */
const COVERAGE_REPORT_WORKSPACES = [
  { dir: 'packages/ui', name: '@repo/ui', run: true },
  { dir: 'packages/server', name: '@repo/server', run: true },
  { dir: 'apps/react-router', name: 'vite-react-compiler', run: false },
  // Phase 2 — remaining library packages with a DB-free test:coverage.
  // scan-ingestion's task measures its DB-free subset only (its real-Postgres
  // queries/* stay out), same as the fallow coverage merge.
  { dir: 'packages/node-runtime', name: '@repo/node-runtime', run: true },
  { dir: 'packages/scan-ingestion', name: '@repo/scan-ingestion', run: true },
  { dir: 'packages/utils', name: '@repo/utils', run: true },
];

const runAll = process.argv.includes('--all');
const shouldRun = !process.argv.includes('--no-run');
const changedOnly = process.argv.includes('--changed');

/**
 * The workspaces to report on. With `--changed`, scopes the list to the ones a
 * diff (paths on stdin) actually affected — changed workspaces plus their
 * dependents — so an unrelated PR does not re-run coverage the test step
 * already skipped. A root/shared change (mode `full`) keeps the whole list.
 * Without the flag, reports every workspace (local + main-branch behaviour).
 */
const reportedWorkspaces = () => {
  if (!changedOnly) {
    return COVERAGE_REPORT_WORKSPACES;
  }
  const files = readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const { mode, packages } = resolveAffected({
    files,
    graph: readWorkspaceGraph(REPO_ROOT),
  });
  if (mode === 'full') {
    return COVERAGE_REPORT_WORKSPACES;
  }
  const affected = new Set(packages);
  return COVERAGE_REPORT_WORKSPACES.filter((workspace) =>
    affected.has(workspace.name),
  );
};

const summaryPathFor = ({ dir }) =>
  join(REPO_ROOT, dir, 'coverage/coverage-summary.json');

const runCoverage = async ({ name }) => {
  process.stdout.write(`• ${name} — running test:coverage…\n`);
  try {
    await execFileAsync(VP_BIN, ['run', '--filter', name, 'test:coverage'], {
      cwd: REPO_ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    // Non-fatal: `test:ci` is the authoritative test gate. Warn and let the
    // read step surface whatever (if any) summary the run left behind.
    process.stderr.write(
      `  ⚠ ${name}: test:coverage failed — its coverage may be missing from the report.\n`,
    );
  }
};

/**
 * Reads one workspace's json-summary `.total`, narrowed to the reported metrics.
 * Callers filter to workspaces whose summary exists first, so this never has to
 * represent an absent report.
 */
const readWorkspaceTotal = async (workspace) => {
  const summary = JSON.parse(await readFile(summaryPathFor(workspace), 'utf8'));
  const total = Object.fromEntries(
    METRICS.map((metric) => [metric, summary.total[metric]]),
  );
  return { name: workspace.name, dir: workspace.dir, total };
};

/**
 * Aggregates the reported workspaces into a monorepo total. Istanbul totals key
 * disjoint file sets across workspaces, so summing `total`/`covered`/`skipped`
 * and recomputing `pct` is exact. A metric with no code (total 0) reports 100%,
 * matching Istanbul's own convention for an empty denominator.
 */
const aggregateTotal = (workspaces) =>
  Object.fromEntries(
    METRICS.map((metric) => {
      const summed = workspaces.reduce(
        (acc, { total }) => ({
          total: acc.total + total[metric].total,
          covered: acc.covered + total[metric].covered,
          skipped: acc.skipped + total[metric].skipped,
        }),
        { total: 0, covered: 0, skipped: 0 },
      );
      const pct =
        summed.total === 0 ? 100 : (summed.covered / summed.total) * 100;
      return [metric, { ...summed, pct }];
    }),
  );

const formatCell = (metric) =>
  `${metric.pct.toFixed(1)}% (${metric.covered}/${metric.total})`;

const printTable = (workspaces, total) => {
  const rows = [
    ...workspaces.map((w) => [
      w.name,
      ...METRICS.map((m) => formatCell(w.total[m])),
    ]),
    ['Monorepo total', ...METRICS.map((m) => formatCell(total[m]))],
  ];
  const header = [
    'Workspace',
    ...METRICS.map((m) => m[0].toUpperCase() + m.slice(1)),
  ];
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length)),
  );
  const line = (cells) =>
    cells.map((cell, i) => cell.padEnd(widths[i])).join('  ');
  process.stdout.write(`\n${line(header)}\n`);
  process.stdout.write(`${widths.map((w) => '-'.repeat(w)).join('  ')}\n`);
  for (const row of rows) process.stdout.write(`${line(row)}\n`);
};

const main = async () => {
  const workspaces = reportedWorkspaces();

  // Scoped run that touched no reported workspace: there is nothing to measure,
  // and that is a success, not a failure. The PR-comment step already treats a
  // missing summary gracefully.
  if (changedOnly && workspaces.length === 0) {
    process.stdout.write(
      'coverage: no coverage-reported workspace changed — skipping report.\n',
    );
    return;
  }

  if (shouldRun) {
    for (const workspace of workspaces) {
      if (workspace.run || runAll) await runCoverage(workspace);
    }
  }

  // Filter the absent summaries out before reading — a missing suite degrades
  // the report gracefully (warned + skipped) instead of crashing it.
  const missing = workspaces.filter(
    (workspace) => !existsSync(summaryPathFor(workspace)),
  );
  for (const { name, dir } of missing) {
    process.stderr.write(
      `  ⚠ ${name}: no coverage-summary.json at ${dir}/coverage/ — skipped.\n`,
    );
  }

  const present = workspaces.filter((workspace) =>
    existsSync(summaryPathFor(workspace)),
  );
  if (present.length === 0) {
    // In --changed mode a coverage hiccup must not fail the job (test:changed is
    // the gate); elsewhere an empty result means the run was misconfigured.
    if (changedOnly) {
      process.stdout.write(
        'coverage: no summaries produced for the changed workspaces — skipping report.\n',
      );
      return;
    }
    throw new Error(
      'no workspace coverage found — run without --no-run, or run `vp run test:ci` first.',
    );
  }

  const totals = await Promise.all(present.map(readWorkspaceTotal));

  const total = aggregateTotal(totals);
  const report = { workspaces: totals, total };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  printTable(totals, total);
  process.stdout.write(
    `\n✔ wrote ${totals.length}-workspace coverage report → coverage/monorepo-coverage-summary.json\n`,
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
}
