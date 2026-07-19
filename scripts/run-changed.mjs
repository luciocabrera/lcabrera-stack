/**
 * Runs one uniform per-workspace task (typecheck, lint, …) only for the
 * workspaces a diff changed plus their transitive dependents — the generic
 * sibling of `test-changed.mjs` for tasks that need no per-task substitution.
 * It reads the diff on STDIN, resolves the affected set via `affected-tests.mjs`,
 * and runs `vp run --filter <affected> <task>`. A root/shared change runs the
 * full set; a docs/tooling-only change runs nothing.
 *
 * `test:changed` scoping was proven safe for tests; a type/lint error a change
 * introduces surfaces in the changed workspace or something that imports it, and
 * the dependents walk covers exactly that. The full run still happens on `main`,
 * and `vp check`'s repo-wide tsgolint pass stays as a type-aware net.
 *
 * Usage (from the repo root):
 *   git diff --name-only "$(git merge-base origin/main HEAD)" | node scripts/run-changed.mjs typecheck
 *   … | node scripts/run-changed.mjs typecheck --markdown   # selection summary as markdown
 *   … | node scripts/run-changed.mjs typecheck --dry-run    # print the vp command, run nothing
 *
 * Exit codes: 0 = every workspace passed (or nothing to run), otherwise the
 * failing `vp run` exit code.
 */
import {
  readWorkspaceGraph,
  renderSelectionMarkdown,
  resolveAffected,
  workspaceDispositions,
} from './lib/affected-tests.mjs';
import {
  printReport,
  readChangedFiles,
  REPO_ROOT,
  runGroupsAsGate,
  runMain,
} from './lib/changed-runner.mjs';

/** A friendlier markdown heading per known task; falls back to the task name. */
const MARKDOWN_TITLES = { typecheck: '🔎 Type-check Selection' };

const main = async () => {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const task = argv.find((arg) => !arg.startsWith('--'));
  if (task === undefined) {
    process.stderr.write('run-changed: missing <task> argument\n');
    process.exitCode = 1;
    return;
  }

  const files = readChangedFiles();
  const graph = readWorkspaceGraph(REPO_ROOT);
  const { mode, packages, changed } = resolveAffected({ files, graph });
  const groups = packages.length === 0 ? [] : [{ task, packages }];
  const dispositions = workspaceDispositions({
    graph,
    affected: packages,
    changed,
    groups,
  });

  if (flags.has('--markdown')) {
    const title = MARKDOWN_TITLES[task] ?? `\`${task}\` selection`;
    process.stdout.write(
      `${renderSelectionMarkdown(mode, dispositions, { title })}\n`,
    );
    return;
  }

  printReport({ label: `${task}:changed`, verb: task, mode, dispositions });

  if (groups.length === 0) {
    process.stdout.write(`Nothing to ${task}.\n`);
    return;
  }

  await runGroupsAsGate(groups, { dryRun: flags.has('--dry-run') });
};

await runMain(main);
