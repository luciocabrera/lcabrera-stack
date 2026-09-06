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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveHostRoot } from './host-root.mjs';

export const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

export const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

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

export const runGroupsAsGate = async (groups, options) => {
  const failed = await runGroups(groups, options);
  if (failed !== 0) {
    process.exitCode = failed;
  }
};

export const runMain = async (main) => {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`\n✖ ${error.message}\n`);
    process.exitCode = 1;
  }
};
