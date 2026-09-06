#!/usr/bin/env node
/**
 * Aggregates each reported workspace's `coverage-summary.json` into the one
 * per-workspace + monorepo summary a coverage comment renders,
 * `gates.coverage.summaryFile`.
 *
 * The roster is `gates.coverage.reportWorkspaces`, and an empty one is refused
 * rather than reported over. `run: true` means this runs that workspace's
 * `test:coverage` first; `run: false` means its summary is already produced
 * upstream.
 *
 * WHY A SEPARATE SCRIPT FROM merge-coverage.mjs
 * ---------------------------------------------
 * Different roster, different reporter, different consumer. That one feeds a
 * *gate* with detailed `coverage-final.json` from the workspaces whose suites
 * need no external service; this one feeds a *comment* with
 * `coverage-summary` totals for the surfaces worth showing a reviewer, which
 * can include a workspace the gate deliberately leaves out. Coupling them
 * would drag each roster into the other.
 *
 * Usage (from the repository root):
 *   repo-coverage-report                 # run the `run: true` workspaces, aggregate
 *   repo-coverage-report --all           # run every workspace's test:coverage
 *   repo-coverage-report --no-run        # aggregate existing summaries, run nothing
 *   … | repo-coverage-report --changed   # only the workspaces the diff on stdin affects
 *
 * Best-effort by design: a workspace whose coverage is missing or whose suite
 * fails is warned about and skipped, because the test task is the real gate and
 * a partial report is more useful than none. Exit codes: 0 = a report was
 * written, or there was nothing to report; 1 = the roster is empty, or no
 * summary could be read at all.
 */
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { readWorkspaceGraph, resolveAffected } from './affected-tests.mjs';
import { readGates } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const { reportWorkspaces: REPORT_WORKSPACES, summaryFile: SUMMARY_FILE } =
  readGates(REPO_ROOT).coverage;
const OUTPUT_PATH = join(REPO_ROOT, SUMMARY_FILE);

const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

const METRICS = ['lines', 'statements', 'functions', 'branches'];

const runAll = process.argv.includes('--all');
const shouldRun = !process.argv.includes('--no-run');
const changedOnly = process.argv.includes('--changed');

const reportedWorkspaces = () => {
  if (!changedOnly) {
    return REPORT_WORKSPACES;
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
    return REPORT_WORKSPACES;
  }
  const affected = new Set(packages);
  return REPORT_WORKSPACES.filter((workspace) => affected.has(workspace.name));
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
    METRICS.map((metric) => [metric, summary.total[metric]]),
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
  if (REPORT_WORKSPACES.length === 0) {
    throw new Error(
      '`gates.coverage.reportWorkspaces` names no workspace in devkit.config.json — refusing to report coverage for nothing.',
    );
  }
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
