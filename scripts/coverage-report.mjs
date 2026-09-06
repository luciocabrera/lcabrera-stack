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
 * (the showcase's, because `test:ci` runs its coverage last), so the PR only ever
 * saw one app's numbers with no label. This collects each reported workspace's
 * own `coverage-summary.json`, tags it with the project name, and aggregates a
 * monorepo-wide total, so the comment shows one row per workspace plus a total.
 *
 * WHY A SEPARATE SCRIPT FROM merge-coverage.mjs
 * ---------------------------------------------
 * merge-coverage.mjs feeds the *fallow gate* — detailed `coverage-final.json`,
 * DB-free workspaces only, and the showcase is deliberately excluded (its suite
 * is the largest and its fallow findings are baselined, so coverage buys that
 * gate nothing). This feeds the *PR comment* — per-workspace `coverage-summary`
 * totals for the public-facing surfaces, which explicitly include the showcase.
 * Different workspace sets, different inputs, different consumers; coupling them
 * would drag the showcase into the fallow merge it is meant to stay out of.
 *
 * ROLLOUT
 * -------
 * The reported set is COVERAGE_REPORT_WORKSPACES in lib/coverage-workspaces.mjs
 * — shared with the fallow merge's own list so both can be asserted by
 * lib/coverage-workspaces.test.mjs, which fails if a public package drops out.
 * The phased plan for adding the rest lives in docs/tooling/coverage-reporting.md.
 *
 * Usage (from the repo root):
 *   vp run coverage:report              # run test:coverage for `run:true` workspaces, read the rest, aggregate
 *   node scripts/coverage-report.mjs    # same, direct
 *   node scripts/coverage-report.mjs --all       # also run the showcase's test:coverage (standalone local use)
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
import { normaliseMetric, percentageOf } from './lib/coverage-metrics.mjs';
import { COVERAGE_REPORT_WORKSPACES } from './lib/coverage-workspaces.mjs';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUTPUT_PATH = join(REPO_ROOT, 'coverage/monorepo-coverage-summary.json');

const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

const METRICS = ['lines', 'statements', 'functions', 'branches'];

const runAll = process.argv.includes('--all');
const shouldRun = !process.argv.includes('--no-run');
const changedOnly = process.argv.includes('--changed');

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
    process.stderr.write(
      `  ⚠ ${name}: test:coverage failed — its coverage may be missing from the report.\n`,
    );
  }
};

const readWorkspaceTotal = async (workspace) => {
  const summary = JSON.parse(await readFile(summaryPathFor(workspace), 'utf8'));
  const total = Object.fromEntries(
    METRICS.map((metric) => [metric, normaliseMetric(summary.total[metric])]),
  );
  return { name: workspace.name, dir: workspace.dir, total };
};

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
      return [metric, { ...summed, pct: percentageOf(summed) }];
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
