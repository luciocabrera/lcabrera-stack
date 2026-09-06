#!/usr/bin/env node
/**
 * Generates machine-readable JSON reports for ALL THREE linters into the
 * canonical reports/ tree, following the same `<tool>/full-latest.json`
 * convention as fallow (reports/fallow/full-latest.json):
 *
 *   reports/oxlint/full-latest.json  — one repo-wide `vp lint . --format=json`
 *                                      run (oxlint JSON: { diagnostics, ... },
 *                                      see https://oxc.rs/docs/guide/usage/linter/output-formats)
 *   reports/eslint/full-latest.json  — the standard eslint `--format json`
 *                                      result array (one object per linted
 *                                      file, incl. suppressedMessages), merged
 *                                      across every workspace that owns an
 *                                      eslint.config.mjs, file paths made
 *                                      repo-relative
 *                                      (see https://eslint.org/docs/latest/use/formatters/#json)
 *   reports/biome/full-latest.json   — one repo-wide `biome lint . --reporter=json`
 *                                      run ({ summary, diagnostics, command }).
 *                                      Root-only by design, mirroring the gate:
 *                                      biome.jsonc's `overrides` already scope
 *                                      the react domain, so unlike eslint there
 *                                      is nothing to fan out per workspace.
 *
 * Every linter runs in CHECK mode (no --fix/--write) — generating a report never
 * mutates sources. Lint findings do not fail the script (they ARE the report);
 * only fatal tool errors (bad config, crash) do.
 *
 * Usage (from the repo root):
 *   vp run lint:report                 # all three tools
 *   repo-lint-report                   # same, direct
 *   repo-lint-report --only=eslint
 *   repo-lint-report --only=oxlint
 *   repo-lint-report --only=biome
 *
 * Exit codes: 0 = reports written, 1 = a linter failed to run (not "found
 * findings" — findings land in the report with exit 0).
 */
import { execFile } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { readGates, readPublishing } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const REPORTS_DIR = readGates(REPO_ROOT).lintReport.reportsDir;
const REPORT_ROOT = join(REPO_ROOT, REPORTS_DIR);
const WORKSPACE_DIRS = readPublishing(REPO_ROOT).workspaceDirs;
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;
const ESLINT_CONCURRENCY = 4;

const toRepoRelative = (filePath) =>
  relative(REPO_ROOT, filePath).replaceAll('\\', '/');

const isFindingsExit = (error) =>
  error.code === 1 && typeof error.stdout === 'string';

const runLinter = async (command, args, cwd) => {
  try {
    const { stdout } = await execFileAsync(command, args, {
      cwd,
      maxBuffer: MAX_BUFFER_BYTES,
    });
    return stdout;
  } catch (error) {
    if (isFindingsExit(error)) {
      return error.stdout;
    }
    throw new Error(
      `${command} ${args.join(' ')} failed in ${toRepoRelative(cwd)}`,
      { cause: error },
    );
  }
};

const writeReport = async (tool, payload) => {
  const outputDir = join(REPORT_ROOT, tool);
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    join(outputDir, 'full-latest.json'),
    `${JSON.stringify(payload, undefined, 2)}\n`,
  );
};

const findEslintWorkspaces = () => {
  const groupDirs = WORKSPACE_DIRS.map((group) => join(REPO_ROOT, group));
  const candidates = groupDirs.flatMap((groupDir) =>
    readdirSync(groupDir).map((name) => join(groupDir, name)),
  );
  return candidates
    .filter((workspaceDir) =>
      existsSync(join(workspaceDir, 'eslint.config.mjs')),
    )
    .sort((left, right) => left.localeCompare(right));
};

const generateEslintReport = async () => {
  const workspaces = findEslintWorkspaces();
  const queue = [...workspaces];
  const results = [];

  const worker = async () => {
    for (let dir = queue.shift(); dir; dir = queue.shift()) {
      const stdout = await runLinter(
        join(dir, 'node_modules/.bin/eslint'),
        ['.', '--config', 'eslint.config.mjs', '--format', 'json'],
        dir,
      );
      for (const entry of JSON.parse(stdout)) {
        results.push({ ...entry, filePath: toRepoRelative(entry.filePath) });
      }
    }
  };

  await Promise.all(Array.from({ length: ESLINT_CONCURRENCY }, () => worker()));
  results.sort((left, right) => left.filePath.localeCompare(right.filePath));
  await writeReport('eslint', results);

  const totals = results.reduce(
    (accumulator, entry) => ({
      errors: accumulator.errors + entry.errorCount,
      suppressed: accumulator.suppressed + entry.suppressedMessages.length,
      warnings: accumulator.warnings + entry.warningCount,
    }),
    { errors: 0, suppressed: 0, warnings: 0 },
  );
  console.log(
    `eslint: ${workspaces.length} workspaces, ${results.length} files → ${REPORTS_DIR}/eslint/full-latest.json ` +
      `(${totals.errors} errors, ${totals.warnings} warnings, ${totals.suppressed} suppressed)`,
  );
};

const relativizeDiagnosticPaths = (diagnostics) => {
  for (const diagnostic of diagnostics) {
    if (typeof diagnostic.filename === 'string') {
      diagnostic.filename = toRepoRelative(
        resolve(REPO_ROOT, diagnostic.filename),
      );
    }
  }
};

const generateOxlintReport = async () => {
  const stdout = await runLinter(
    'vp',
    ['lint', '.', '--format=json'],
    REPO_ROOT,
  );
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? [];
  relativizeDiagnosticPaths(diagnostics);
  await writeReport('oxlint', report);
  console.log(
    `oxlint: ${report.number_of_files} files, ${diagnostics.length} diagnostics → ${REPORTS_DIR}/oxlint/full-latest.json`,
  );
};

const relativizeBiomeDiagnosticPaths = (diagnostics) => {
  for (const diagnostic of diagnostics) {
    const path = diagnostic.location?.path;
    if (typeof path === 'string') {
      diagnostic.location.path = toRepoRelative(resolve(REPO_ROOT, path));
    }
  }
};

const generateBiomeReport = async () => {
  const stdout = await runLinter(
    join(REPO_ROOT, 'node_modules/.bin/biome'),
    ['lint', '.', '--reporter=json'],
    REPO_ROOT,
  );
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? [];
  relativizeBiomeDiagnosticPaths(diagnostics);
  await writeReport('biome', report);
  const { errors = 0, warnings = 0 } = report.summary ?? {};
  console.log(
    `biome: ${diagnostics.length} diagnostics → ${REPORTS_DIR}/biome/full-latest.json ` +
      `(${errors} errors, ${warnings} warnings)`,
  );
};

const TOOLS = ['biome', 'eslint', 'oxlint'];

const parseOnlyArgument = () => {
  const argument = process.argv.find((entry) => entry.startsWith('--only='));
  if (argument === undefined) {
    return undefined;
  }
  const only = argument.slice('--only='.length);
  if (!TOOLS.includes(only)) {
    const quotedTools = TOOLS.map((tool) => `"${tool}"`).join(', ');
    throw new TypeError(
      `--only expects one of ${quotedTools}, received "${only}"`,
    );
  }
  return only;
};

const main = async () => {
  const only = parseOnlyArgument();
  if (only === undefined || only === 'oxlint') {
    await generateOxlintReport();
  }
  if (only === undefined || only === 'eslint') {
    await generateEslintReport();
  }
  if (only === undefined || only === 'biome') {
    await generateBiomeReport();
  }
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
