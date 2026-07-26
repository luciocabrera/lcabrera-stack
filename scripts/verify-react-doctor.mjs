/**
 * Runs React Doctor and gates on its error-severity findings.
 *
 * Why a script instead of calling the CLI from a package.json line:
 *
 * 1. The human-readable run is not safe to gate on. Without a `doctor` entry in
 *    package.json the CLI decides React Doctor "is not installed in this
 *    project", prints a setup suggestion and exits 0 — scanning nothing. A gate
 *    wired to that command reports success for the one reason that should fail
 *    loudest. Reading `--json` output sidesteps the heuristic entirely.
 *
 * 2. A findings count of zero has two causes, and they must not look alike. A
 *    clean repo and a run that never happened (bad config, unreadable base ref,
 *    a crash) both emit no diagnostics; only `ok` separates them. This asserts
 *    `ok` before it believes the count — the same failure mode that makes
 *    Biome's silent config fallback dangerous (AGENTS.md §4).
 *
 * Both modes write the report, so the findings behind a failure are on disk
 * without a second scan. Nothing is committed (ADR-049).
 *
 * Usage:
 *   node scripts/verify-react-doctor.mjs            # gate: fails on any error
 *   node scripts/verify-react-doctor.mjs --report   # report only, never fails
 *
 * Exit codes: 0 = no error-severity findings, 1 = findings or a failed run.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { parseJsonc } from './lib/jsonc.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = 'reports/react-doctor/full-latest.json';
const CONFIG = 'doctor.config.jsonc';

/**
 * The CLI's real entry file.
 *
 * The package's own `bin` script, run with `process.execPath` rather than
 * spawned by name, so nothing is searched for on PATH (Sonar S4036) and the
 * pinned `catalog:lint` version is the one that runs — not whatever a global
 * install happens to provide.
 *
 * Deliberately NOT `node_modules/.bin/react-doctor`: pnpm writes that as a
 * `#!/bin/sh` wrapper rather than a symlink, so it is not a JS file, resolving
 * it with `realpathSync` returns the wrapper itself, and handing it to node
 * fails on the shell syntax.
 */
const entryPoint = () =>
  realpathSync(
    join(REPO_ROOT, 'node_modules', 'react-doctor', 'bin', 'react-doctor.js'),
  );

/** Runs a scan and returns its parsed report, or exits if it cannot. */
const scan = () => {
  const out = join(REPO_ROOT, REPORT);
  mkdirSync(dirname(out), { recursive: true });
  try {
    execFileSync(
      process.execPath,
      // `--blocking none` so the exit code carries no verdict: this script
      // decides, from the report, after checking the run actually happened.
      [
        entryPoint(),
        '.',
        '--json',
        '--json-out',
        out,
        '--blocking',
        'none',
        '-y',
      ],
      { cwd: REPO_ROOT, stdio: ['ignore', 'ignore', 'inherit'] },
    );
  } catch (error) {
    fail(`react-doctor could not be run: ${error.message}`);
  }
  return JSON.parse(readFileSync(out, 'utf8'));
};

const fail = (message) => {
  process.stderr.write(`✗ ${message}\n`);
  process.exit(1);
};

/** One line per finding, in the `file:line rule` shape editors linkify. */
const render = ({ id, line, message, normalizedFilePath, rule }) => {
  const [repoPath] = (id ?? '').split('::');
  return `  ${repoPath || normalizedFilePath}:${line}  ${rule}\n      ${message}`;
};

/**
 * Fails if the config is not parseable, BEFORE the scan runs.
 *
 * Measured, not assumed: fed a malformed `doctor.config.jsonc`, React Doctor
 * discards it, falls back to built-in defaults and still reports `ok: true`.
 * Every `off` and `ignore` in the file silently stops applying, so a repo whose
 * suppressions are all on warnings would sail through a "clean" gate while
 * scanning under a configuration nobody chose. Same failure mode Biome has
 * (AGENTS.md §4), and the reason that file must stay valid rather than merely
 * present.
 */
const assertConfigParses = () => {
  const path = join(REPO_ROOT, CONFIG);
  try {
    parseJsonc(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(
      `${CONFIG} is not valid JSONC: ${error.message}\n` +
        '  React Doctor would ignore it and scan with default rules while still\n' +
        '  reporting success, so this fails here instead.',
    );
  }
};

const main = () => {
  assertConfigParses();
  const report = scan();

  // Before the count means anything, the run has to have happened.
  if (report.ok !== true) {
    fail(
      `react-doctor did not complete: ${report.error?.message ?? 'unknown error'}\n` +
        '  A zero-finding report from a failed run is indistinguishable from a clean one,\n' +
        '  so this is a gate failure rather than a pass.',
    );
  }

  const { errorCount = 0, warningCount = 0 } = report.summary ?? {};
  const errors = report.diagnostics.filter(
    (finding) => finding.severity === 'error',
  );

  if (process.argv.includes('--report')) {
    process.stdout.write(
      `Wrote ${REPORT}: ${errorCount} error(s), ${warningCount} warning(s).\n`,
    );
    return;
  }

  if (errors.length > 0) {
    process.stderr.write('\nReact Doctor error-severity finding(s):\n');
    for (const finding of errors) process.stderr.write(`${render(finding)}\n`);
    fail(
      `${errors.length} error-severity finding(s). Fix the code; a genuine false ` +
        `positive needs a justified entry in doctor.config.jsonc (see ADR-055).`,
    );
  }

  process.stdout.write(
    `React Doctor gate passed: 0 errors, ${warningCount} warning(s) (advisory). Report: ${REPORT}\n`,
  );
};

main();
