/**
 * Shared runner plumbing for the change-based `*:changed` commands
 * (`test-changed.mjs`, `run-changed.mjs`): read the diff on stdin, print the
 * per-workspace disposition report, and run the resolved `vp run` groups by
 * absolute vp path. Kept in one module so each runner stays a thin shell over
 * `affected-tests.mjs` and the two don't copy-paste the spawn/report code. See
 * `.claude/rules/scripts.md`.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

// The workspace's own vp shim by absolute path — never a bare `vp` resolved
// through $PATH, which a directory earlier in PATH could shadow (the Sonar
// S4036 hotspot). `vp install` always provides this shim.
export const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

/** The changed file paths piped in on stdin (the caller runs git). */
export const readChangedFiles = () =>
  readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const vpArgsFor = ({ task, packages }) => [
  'run',
  ...packages.flatMap((pkg) => ['--filter', pkg]),
  task,
];

/** Print each workspace's disposition — what runs, what is skipped, and why.
 *  `extra` names groups outside every workspace, which the tally cannot show. */
export const printReport = ({
  label,
  verb,
  mode,
  dispositions,
  extra = [],
}) => {
  const running = dispositions.filter((disposition) => disposition.running);
  const skipped = dispositions.filter((disposition) => !disposition.running);
  process.stdout.write(
    `\n${label} — ${mode} run: ${running.length}/${dispositions.length} workspace(s) affected\n`,
  );
  if (extra.length > 0) {
    process.stdout.write('\nPlus (outside every workspace):\n');
    for (const note of extra) process.stdout.write(`  • ${note}\n`);
  }
  if (running.length > 0) {
    process.stdout.write('\nRunning:\n');
    for (const { dir, reason, task } of running) {
      // Show the task in parens only when it adds information (e.g. the tests'
      // `test:ci` variant); for a uniform task it just repeats `verb`.
      const suffix = task && task !== verb ? ` (${task})` : '';
      process.stdout.write(
        `  • ${dir} — ${reason}, running ${verb}${suffix}\n`,
      );
    }
  }
  if (skipped.length > 0) {
    process.stdout.write('\nSkipped:\n');
    for (const { dir } of skipped) {
      process.stdout.write(
        `  • ${dir} — no changes detected, skipping ${verb}\n`,
      );
    }
  }
  process.stdout.write('\n');
};

/**
 * Run each group as `vp run --filter … <task>`, streaming output. `--dry-run`
 * prints the commands instead of running them. Returns the first non-zero exit
 * code (0 when every group passed) so a failure still fails the gate.
 */
const runGroups = async (groups, { dryRun = false } = {}) => {
  if (dryRun) {
    for (const group of groups) {
      process.stdout.write(`vp ${vpArgsFor(group).join(' ')}\n`);
    }
    return 0;
  }
  let failed = 0;
  for (const group of groups) {
    process.stdout.write(`\n▶ vp ${vpArgsFor(group).join(' ')}\n`);
    const code = await new Promise((res) => {
      const child = spawn(VP_BIN, vpArgsFor(group), {
        cwd: REPO_ROOT,
        stdio: 'inherit',
      });
      child.on('close', (exitCode) => res(exitCode ?? 0));
      child.on('error', () => res(1));
    });
    if (code !== 0) {
      failed = code;
    }
  }
  return failed;
};

/** Run the resolved groups and reflect the first failure in the exit code. */
export const runGroupsAsGate = async (groups, options) => {
  const failed = await runGroups(groups, options);
  if (failed !== 0) {
    process.exitCode = failed;
  }
};

/** Top-level entry wrapper: run `main`, turning a throw into a non-zero exit. */
export const runMain = async (main) => {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`\n✖ ${error.message}\n`);
    process.exitCode = 1;
  }
};
