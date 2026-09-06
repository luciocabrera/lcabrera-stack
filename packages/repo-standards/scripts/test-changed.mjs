#!/usr/bin/env node
/**
 * Runs tests only for the workspaces a diff touched, plus their transitive
 * dependents — the fast alternative to `vp run test:all`/`test:ci` when most of
 * the monorepo is untouched. It reads the changed file paths on STDIN (the
 * caller runs git, matching `pr-labels.mjs`), asks `affected-tests.mjs` which
 * `vp run` groups cover them, and runs each group. A root/shared change falls
 * back to the full suite; a change under `scripts/` adds the root `test:scripts`
 * group (those suites are in no workspace); a docs-only change runs nothing.
 *
 * Usage (from the repo root):
 *   git diff --name-only "$(git merge-base origin/main HEAD)" | repo-test-changed
 *   … | repo-test-changed --ci        # CI parity: coverage `test:ci` last
 *   … | repo-test-changed --markdown  # emit the selection summary as markdown
 *   … | repo-test-changed --dry-run   # print the vp commands, run nothing
 *
 * The `test:changed` package.json script wires up the git half. Exit codes:
 * 0 = every group passed (or nothing to run), otherwise the first failing
 * group's exit code — so a red suite still fails the gate.
 */
import {
  readWorkspaceGraph,
  renderSelectionMarkdown,
  resolveTestGroups,
  workspaceDispositions,
} from './affected-tests.mjs';
import {
  printReport,
  readChangedFiles,
  REPO_ROOT,
  runGroupsAsGate,
  runMain,
} from './changed-runner.mjs';
import { readGates } from './config.mjs';

const main = async () => {
  const args = new Set(process.argv.slice(2));
  const markdown = args.has('--markdown');
  const dryRun = args.has('--dry-run');
  const ci = args.has('--ci');

  const files = readChangedFiles();
  const graph = readWorkspaceGraph(REPO_ROOT);
  const { mode, groups, packages, changed, scripts } = resolveTestGroups({
    files,
    graph,
    ci,
    coverageTaskPackage: readGates(REPO_ROOT).affectedTests.coverageTaskPackage,
  });
  const dispositions = workspaceDispositions({
    graph,
    affected: packages,
    changed,
    groups,
  });

  if (markdown) {
    process.stdout.write(
      `${renderSelectionMarkdown(mode, dispositions, { scripts })}\n`,
    );
    return;
  }

  printReport({
    dispositions,
    extra: scripts
      ? ['test:scripts — a scripts/ file changed, and it is in no workspace']
      : [],
    label: 'test:changed',
    mode,
    verb: 'tests',
  });

  if (groups.length === 0) {
    process.stdout.write('Nothing to test.\n');
    return;
  }

  await runGroupsAsGate(groups, { dryRun });
};

await runMain(main);
