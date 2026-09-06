#!/usr/bin/env node
/**
 * Runs the coverage suites named by `gates.coverage.mergeWorkspaces` and merges
 * their Istanbul reports into the one file `fallow audit --coverage` reads,
 * `gates.coverage.mergedFile`.
 *
 * WHY THIS EXISTS
 * ---------------
 * `fallow audit` scores CRAP as `cyclomatic² × (1 − coverage)³ + cyclomatic`
 * against a threshold. Given no coverage data it *estimates* coverage from
 * whether a colocated test file exists (none → 0%, partial → 40%), so every
 * function with cyclomatic ≥ 5 and no colocated test breaches the threshold on
 * complexity it does not have. Feeding measured coverage replaces the guess.
 *
 * A workspace joins the roster only if its coverage run needs no external
 * service — this runs wherever the audit runs, which is not where a database
 * is. An empty roster is refused rather than merged over.
 *
 * Usage (from the repository root):
 *   repo-merge-coverage                  # run the suites, then merge
 *   repo-merge-coverage --no-run         # merge already-generated reports
 *   … | repo-merge-coverage --changed    # only the workspaces the diff on
 *                                        # stdin touches; a new-only audit
 *                                        # never consults the others
 *
 * Exit codes: 0 = merged report written, 1 = a suite failed or produced no
 * coverage (a partial merge is worse than none — it would silently score
 * uncovered files as 0% and fail the gate on phantom complexity).
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
const GATES = readGates(REPO_ROOT);
const { mergeWorkspaces: COVERAGE_WORKSPACES, mergedFile: MERGED_FILE } =
  GATES.coverage;
const OUTPUT_PATH = join(REPO_ROOT, MERGED_FILE);

const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

const shouldRun = !process.argv.includes('--no-run');
const changedOnly = process.argv.includes('--changed');

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
    globalPackages: GATES.affectedTests.globalPackages,
    graph: readWorkspaceGraph(REPO_ROOT),
    lintOnlyPatterns: GATES.affectedTests.lintOnlyPatterns,
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

const mergeCoverage = (reports) => Object.assign({}, ...reports);

const writeMerged = async (merged) => {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(merged)}\n`);
};

const main = async () => {
  if (COVERAGE_WORKSPACES.length === 0) {
    throw new Error(
      '`gates.coverage.mergeWorkspaces` names no workspace in devkit.config.json — refusing to write a merged report from nothing.',
    );
  }
  const workspaces = targetWorkspaces();

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
    `\n✔ merged ${fileCount} files from ${workspaces.length} workspace(s) → ${MERGED_FILE}\n` +
      `  feed it to the gate: vp run fallow:audit --base origin/main --coverage ${MERGED_FILE}\n`,
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
}
