#!/usr/bin/env node
/**
 * Runs React Doctor and gates on the findings at the severity the config's
 * `blocking` names (`error` when absent).
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
 * 3. The CLI is told `--blocking none` so its exit code never stands in for
 *    the report; this script applies `blocking` itself, after `ok` is known,
 *    to the findings the CLI's `ciFailure` surface keeps.
 *    A `doctor.config.{ts,js,json,…}` beside the `.jsonc` would replace it, so
 *    one present fails the gate before anything is scanned.
 *
 * Both modes write the report, so the findings behind a failure are on disk
 * without a second scan. Nothing is committed (ADR-049).
 *
 * Usage:
 *   repo-verify-react-doctor            # gate: fails on a blocking finding
 *   repo-verify-react-doctor --report   # report only, never fails on findings
 *
 * Exit codes: 0 = no blocking findings, 1 = findings, a bad config or a failed run.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readGates } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { parseJsonc } from './jsonc.mjs';
import {
  findShadowingConfigs,
  GATED_CONFIG,
  judgeReport,
  renderFinding,
} from './react-doctor-finding.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const REPORT = readGates(REPO_ROOT).reactDoctor.reportFile;
const CONFIG = GATED_CONFIG;

const entryPoint = () =>
  realpathSync(
    join(REPO_ROOT, 'node_modules', 'react-doctor', 'bin', 'react-doctor.js'),
  );

const scan = () => {
  const out = join(REPO_ROOT, REPORT);
  mkdirSync(dirname(out), { recursive: true });
  try {
    execFileSync(
      process.execPath,
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
  throw new Error(message);
};

const assertNotShadowed = () => {
  const shadowing = findShadowingConfigs((name) =>
    existsSync(join(REPO_ROOT, name)),
  );
  if (shadowing.length > 0)
    fail(
      `${shadowing.join(', ')} shadows ${CONFIG}: React Doctor loads it instead,\n` +
        `  so the scan would run on rules this gate never read. Delete it, or move\n` +
        `  its settings into ${CONFIG}.`,
    );
};

const readConfig = () => {
  try {
    return parseJsonc(readFileSync(join(REPO_ROOT, CONFIG), 'utf8'));
  } catch (error) {
    return fail(
      `${CONFIG} is not valid JSONC: ${error.message}\n` +
        '  React Doctor would ignore it and scan with default rules while still\n' +
        '  reporting success, so this fails here instead.',
    );
  }
};

const judge = (args) => {
  try {
    return judgeReport(args);
  } catch (error) {
    return fail(`${CONFIG}: ${error.message}`);
  }
};

const main = () => {
  assertNotShadowed();
  const config = readConfig();
  const report = scan();

  if (report.ok !== true) {
    fail(
      `react-doctor did not complete: ${report.error?.message ?? 'unknown error'}\n` +
        '  A zero-finding report from a failed run is indistinguishable from a clean one,\n' +
        '  so this is a gate failure rather than a pass.',
    );
  }

  const { errorCount = 0, warningCount = 0 } = report.summary ?? {};
  const reportOnly = process.argv.includes('--report');
  const { blocking, level } = judge({
    config,
    diagnostics: report.diagnostics,
    reportOnly,
  });

  if (reportOnly) {
    process.stdout.write(
      `Wrote ${REPORT}: ${errorCount} error(s), ${warningCount} warning(s).\n`,
    );
    return;
  }

  if (blocking.length > 0) {
    process.stderr.write(
      `\nReact Doctor finding(s) at blocking level "${level}":\n`,
    );
    for (const finding of blocking)
      process.stderr.write(`${renderFinding(finding)}\n`);
    fail(
      `${blocking.length} blocking finding(s). Fix the code; a genuine false ` +
        `positive needs a justified entry in ${CONFIG} (see ADR-055).`,
    );
  }

  process.stdout.write(
    `React Doctor gate passed at blocking level "${level}": ${errorCount} error(s), ` +
      `${warningCount} warning(s). Report: ${REPORT}\n`,
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`✗ ${error.message}\n`);
  process.exitCode = 1;
}
