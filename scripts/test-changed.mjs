/**
 * Runs tests only for the workspaces a diff touched, plus their transitive
 * dependents — the fast alternative to `vp run test:all`/`test:ci` when most of
 * the monorepo is untouched. It reads the changed file paths on STDIN (the
 * caller runs git, matching `pr-labels.mjs`), asks `affected-tests.mjs` which
 * `vp run` groups cover them, and runs each group. A root/shared change falls
 * back to the full suite; a docs-only change runs nothing.
 *
 * Usage (from the repo root):
 *   git diff --name-only "$(git merge-base origin/main HEAD)" | node scripts/test-changed.mjs
 *   … | node scripts/test-changed.mjs --ci        # CI parity: coverage `test:ci` last
 *   … | node scripts/test-changed.mjs --dry-run   # print the vp commands, run nothing
 *
 * The `test:changed` package.json script wires up the git half. Exit codes:
 * 0 = every group passed (or nothing to run), otherwise the first failing
 * group's exit code — so a red suite still fails the gate.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readWorkspaceGraph,
  renderSelectionMarkdown,
  resolveTestGroups,
  workspaceDispositions,
} from './lib/affected-tests.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

// Run the workspace's own vp binary by absolute path — never a bare `vp`
// resolved through $PATH, which would let a directory earlier in PATH shadow it
// (the Sonar S4036 hotspot). `vp install` always provides this shim.
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

const readChangedFiles = () =>
  readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const vpArgsFor = ({ task, packages }) => [
  'run',
  ...packages.flatMap((pkg) => ['--filter', pkg]),
  task,
];

const runGroup = (group) =>
  new Promise((res) => {
    const child = spawn(VP_BIN, vpArgsFor(group), {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    child.on('close', (code) => res(code ?? 0));
    child.on('error', () => res(1));
  });

/** Print each workspace's disposition — what runs, what is skipped, and why. */
const printReport = (mode, dispositions) => {
  const running = dispositions.filter((disposition) => disposition.running);
  const skipped = dispositions.filter((disposition) => !disposition.running);
  process.stdout.write(
    `\ntest:changed — ${mode} run: ${running.length}/${dispositions.length} workspace(s) affected\n`,
  );
  if (running.length > 0) {
    process.stdout.write('\nRunning:\n');
    for (const { dir, reason, task } of running) {
      process.stdout.write(`  • ${dir} — ${reason}, running tests (${task})\n`);
    }
  }
  if (skipped.length > 0) {
    process.stdout.write('\nSkipped:\n');
    for (const { dir } of skipped) {
      process.stdout.write(
        `  • ${dir} — no changes detected, skipping tests\n`,
      );
    }
  }
  process.stdout.write('\n');
};

const main = async () => {
  const args = new Set(process.argv.slice(2));
  const markdown = args.has('--markdown');
  const dryRun = args.has('--dry-run');
  const ci = args.has('--ci');

  const files = readChangedFiles();
  const graph = readWorkspaceGraph(REPO_ROOT);
  const { mode, groups, packages, changed } = resolveTestGroups({
    files,
    graph,
    ci,
  });
  const dispositions = workspaceDispositions({
    graph,
    affected: packages,
    changed,
    groups,
  });

  // Report-only: emit the markdown selection summary for CI (job summary + PR
  // comment) and run nothing.
  if (markdown) {
    process.stdout.write(`${renderSelectionMarkdown(mode, dispositions)}\n`);
    return;
  }

  printReport(mode, dispositions);

  if (groups.length === 0) {
    process.stdout.write('Nothing to test.\n');
    return;
  }

  if (dryRun) {
    for (const group of groups) {
      process.stdout.write(`vp ${vpArgsFor(group).join(' ')}\n`);
    }
    return;
  }

  let failed = 0;
  for (const group of groups) {
    process.stdout.write(`\n▶ vp ${vpArgsFor(group).join(' ')}\n`);
    const code = await runGroup(group);
    if (code !== 0) {
      failed = code;
    }
  }
  if (failed !== 0) {
    process.exitCode = failed;
  }
};

try {
  await main();
} catch (error) {
  process.stderr.write(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
}
