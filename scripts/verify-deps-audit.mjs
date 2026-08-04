#!/usr/bin/env node
/**
 * Gate: no known advisory sits unaddressed in the dependency tree.
 *
 * Why this exists: the repo gated command docs, ADR numbering, script size,
 * coordination integrity, published API surface and four linters — but nothing
 * watched its supply chain. A ReDoS advisory against a pinned `hono` was found
 * only because someone went looking (#516 Finding 2), and the fix was already
 * in range of every declared constraint. That is the gap: an advisory whose fix
 * costs nothing still needs somebody to notice it.
 *
 * **This reads the audit on stdin rather than spawning it.** `vp pm audit`
 * forwards to the package manager, and the docs name that form
 * (node_modules/vite-plus/docs/guide/install.md); running it from the shell
 * that owns the toolchain keeps this file free of a PATH-resolved subprocess
 * (Sonar S4036) and makes the whole gate testable from a fixture, which a
 * network call is not.
 *
 * The important consequence is that an empty stdin — the audit crashed, the
 * registry was unreachable, the pipe broke — must NOT read as "nothing found".
 * `auditDidRun` refuses a report that did not walk the tree, so the gate fails
 * loudly instead of passing quietly. A supply-chain check that goes green when
 * it could not run is worse than none, because it is believed.
 *
 * Usage (from the repo root):
 *   vp run deps:audit                     # the gate
 *   vp pm audit --json | node scripts/verify-deps-audit.mjs --minimum high
 *
 * Exit : 0 when nothing blocks, 1 on a blocking advisory, an expired or stale
 *        allowance, or an audit that did not run.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { flagValue, readStdin } from './lib/cli-input.mjs';
import {
  auditDidRun,
  classifyAdvisories,
  formatAdvisory,
  readAdvisories,
} from './lib/deps-audit.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTER = 'docs/agents/dependency-advisories.json';

/**
 * The gate's floor. `moderate` rather than `high` because the advisory that
 * prompted this gate was a moderate one, and rather than `low` because npm
 * classifies a great deal of build-time noise there.
 */
const DEFAULT_MINIMUM = 'moderate';

const readRegister = () => {
  try {
    return JSON.parse(readFileSync(join(REPO_ROOT, REGISTER), 'utf8'));
  } catch {
    return { allowed: [] };
  }
};

/** `YYYY-MM-DD` in UTC, so the gate does not flip at a contributor's midnight. */
const todayUtc = () => new Date().toISOString().slice(0, 10);

const reportBlocking = (blocking) => {
  console.error(
    `\nDependency advisory (or advisories) with no live allowance — fix the dependency, or add a justified, dated entry to ${REGISTER}:`,
  );
  for (const advisory of blocking) {
    console.error(`  ${formatAdvisory(advisory)}`);
    console.error(`      ${advisory.why}. Patched in: ${advisory.patched}`);
    console.error(`      ${advisory.url}`);
  }
};

const reportStale = (stale) => {
  console.error(
    `\nAllowance(s) in ${REGISTER} matching no advisory in the tree — the vulnerability is gone, so remove the entry:`,
  );
  for (const allowance of stale) {
    console.error(`  ${allowance.ghsa} — ${allowance.reason ?? '(no reason)'}`);
  }
};

const main = async () => {
  const raw = await readStdin();
  const minimumSeverity = flagValue('--minimum') ?? DEFAULT_MINIMUM;

  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    console.error(
      'deps audit gate failed: no parseable report on stdin.\n' +
        'Run it as `vp run deps:audit`, which pipes `vp pm audit --json` in. An\n' +
        'empty or truncated report means the audit did not run — that is a\n' +
        'failure, not a clean result.',
    );
    process.exitCode = 1;
    return;
  }

  if (!auditDidRun(report)) {
    console.error(
      'deps audit gate failed: the report counts no dependencies, so the audit\n' +
        'did not walk the tree (an unreachable registry looks exactly like a\n' +
        'clean result otherwise). Re-run with network access.',
    );
    process.exitCode = 1;
    return;
  }

  const advisories = readAdvisories(report);
  const { allowed = [] } = readRegister();
  const { blocking, carried, ignored, stale } = classifyAdvisories({
    advisories,
    allowances: allowed,
    minimumSeverity,
    today: todayUtc(),
  });

  if (blocking.length > 0) reportBlocking(blocking);
  if (stale.length > 0) reportStale(stale);

  if (blocking.length > 0 || stale.length > 0) {
    process.exitCode = 1;
    return;
  }

  const carriedNote =
    carried.length > 0 ? `, ${carried.length} carried under an allowance` : '';
  const ignoredNote =
    ignored.length > 0 ? `, ${ignored.length} below ${minimumSeverity}` : '';
  console.log(
    `Dependency audit clean: ${report.metadata.totalDependencies} dependencies scanned, ` +
      `nothing at or above ${minimumSeverity}${carriedNote}${ignoredNote}.`,
  );
};

await main();
