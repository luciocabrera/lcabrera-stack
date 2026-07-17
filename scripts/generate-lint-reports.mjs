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
 *   vp run lint:report                          # all three tools
 *   node scripts/generate-lint-reports.mjs      # same, direct
 *   node scripts/generate-lint-reports.mjs --only=eslint
 *   node scripts/generate-lint-reports.mjs --only=oxlint
 *   node scripts/generate-lint-reports.mjs --only=biome
 *
 * Exit codes: 0 = reports written, 1 = a linter failed to run (not "found
 * findings" — findings land in the report with exit 0).
 */
import { execFile } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const REPORT_ROOT = join(REPO_ROOT, 'reports');
// Repo-wide file count is in the low thousands; 64 MiB leaves ample headroom
// for the merged JSON on stdout.
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;
const ESLINT_CONCURRENCY = 4;

const toRepoRelative = (filePath) =>
  relative(REPO_ROOT, filePath).replaceAll('\\', '/');

/** Both linters exit 1 when they merely report problems — that is expected
 * report content, not a failure. */
const isFindingsExit = (error) =>
  error.code === 1 && typeof error.stdout === 'string';

/**
 * Runs a linter, returning its stdout even on the "findings" exit code.
 * Anything else (eslint exits 2 on fatal errors) is re-thrown.
 */
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

/** Writes reports/<tool>/full-latest.json, creating the directory. */
const writeReport = async (tool, payload) => {
  const outputDir = join(REPORT_ROOT, tool);
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    join(outputDir, 'full-latest.json'),
    `${JSON.stringify(payload, undefined, 2)}\n`,
  );
};

/** Discovers every workspace directory that owns an eslint.config.mjs. */
const findEslintWorkspaces = () => {
  const groupDirs = ['apps', 'packages'].map((group) => join(REPO_ROOT, group));
  const candidates = groupDirs.flatMap((groupDir) =>
    readdirSync(groupDir).map((name) => join(groupDir, name)),
  );
  return candidates
    .filter((workspaceDir) =>
      existsSync(join(workspaceDir, 'eslint.config.mjs')),
    )
    .sort((left, right) => left.localeCompare(right));
};

/**
 * Merged standard eslint JSON formatter output: each workspace is linted
 * with its own config from its own directory (config factories resolve
 * plugins per workspace), then the per-file result arrays are concatenated
 * with repo-relative paths.
 */
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
    `eslint: ${workspaces.length} workspaces, ${results.length} files → reports/eslint/full-latest.json ` +
      `(${totals.errors} errors, ${totals.warnings} warnings, ${totals.suppressed} suppressed)`,
  );
};

/**
 * One repo-wide oxlint run through vp (so the repo's oxlint config and
 * version apply). Diagnostic filenames are already repo-relative when run
 * from the root; absolute ones are normalized defensively.
 */
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
    `oxlint: ${report.number_of_files} files, ${diagnostics.length} diagnostics → reports/oxlint/full-latest.json`,
  );
};

/**
 * One repo-wide Biome run — root-only on purpose, mirroring the gate: there is
 * no per-workspace lint:biome, because biome.jsonc's `overrides` already scope
 * the react domain. Diagnostic paths are already repo-relative when run from
 * the root; absolute ones are normalized defensively, as for oxlint.
 */
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
    `biome: ${diagnostics.length} diagnostics → reports/biome/full-latest.json ` +
      `(${errors} errors, ${warnings} warnings)`,
  );
};

/** Returns the validated --only=<tool> value, or undefined for "all three". */
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
