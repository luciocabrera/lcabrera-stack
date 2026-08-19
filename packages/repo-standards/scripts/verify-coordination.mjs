/**
 * Verifies the in-git work register under `docs/coordination/` — the canonical
 * "who is working on what" for this monorepo. Keeps the register honest the same
 * way `verify-commands-doc.mjs` keeps COMMANDS.md honest. Pure parsing/rendering
 * live in `packages/repo-standards/scripts/coordination-parse.mjs` and `./lib/coordination-board.mjs`; this
 * file owns the effects (fs, git) and the checks.
 *
 * Two units of work:
 *   - a TASK   (`tasks/<id>.md`)     — one person's claim: owner, status, branch,
 *                                       and `area` globs (the soft lock).
 *   - a shared BRANCH (`branches/<slug>.md`) — declares a branch that MULTIPLE
 *                                       tasks share on purpose (agents that need
 *                                       each other's WIP), with its base, merge
 *                                       target, and integrator. Independent work
 *                                       needs no descriptor; a branch used by 2+
 *                                       active tasks does.
 * `_TEMPLATE.md` and any `_*`-prefixed file are ignored.
 *
 * BOARD.md is NOT a checked artifact: it is a gitignored, local-only VIEW
 * (regenerate it with `--write-board` to read the register as a table). The
 * source of truth is the task files themselves; nothing here compares against a
 * committed board, because a committed generated file is exactly what made every
 * concurrent coordination PR collide (ADR-037). GitHub-visible status lives in
 * the linked Issues + the Planning board (projects/4).
 *
 * Checks (ERROR fails the build; WARN is surfaced but never blocks — a warning
 * must not fail an unrelated PR because someone else's task drifted):
 *   ERROR  schema        — task/branch files have the required, well-typed fields
 *                          and an id/slug matching the filename.
 *   ERROR  unique-id     — no two task files share an id.
 *   WARN   overlap       — two non-done tasks on DIFFERENT branches claim
 *                          intersecting areas (a real collision). Same-branch
 *                          overlap is intended collaboration and is not warned.
 *                          Reads claims from every live remote branch too, not
 *                          just the working tree (#233) — a claim lives on its
 *                          own branch from the moment it is made, so a
 *                          tree-only check compared each agent's claim against
 *                          nothing and called it clean. Anything it could not
 *                          read is warned about rather than skipped.
 *   WARN   shared-branch — 2+ active tasks share a branch with no descriptor
 *                          (declare it or split), or a descriptor has no tasks.
 *   WARN   stale         — a non-done task's `updated:` is older than STALE_DAYS.
 *   WARN   branch        — a task's branch resolves to no local/remote ref (may
 *                          mean it merged and was deleted → close the task).
 *   WARN   ghost         — a live task older than GHOST_DAYS records neither a
 *                          branch nor a PR, so its work is invisible (or already
 *                          merged). Precise "is it merged?" detection is still
 *                          not attempted: squash merges leave no ancestry, so
 *                          the answer would have to come from the PR API.
 *   WARN   reconcile     — a live task records a real PR but its branch is gone
 *                          from the LIVE origin list while a stale local
 *                          `origin/*` ref still "resolves" it (so `branch` above
 *                          stays quiet): the PR landed, delete the task file.
 *
 * Local checks read the working tree only and never shell out (`git-dir.mjs`
 * reads `.git` directly). The overlap check is the one exception — reading a
 * blob out of another branch needs git's object store — and it goes through
 * `git-exec.mjs`, which pins PATH to system directories (S4036) and strips the
 * repository-selecting variables.
 *
 * Modes:
 *   node scripts/verify-coordination.mjs                 → verify (default)
 *   node scripts/verify-coordination.mjs --no-remote     → skip the remote read
 *                                                          (offline / fast loop)
 *   node scripts/verify-coordination.mjs --write-board   → write the local,
 *                                                          gitignored BOARD.md view
 *
 * Exit codes: 0 = consistent (warnings allowed), 1 = an ERROR check failed.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkoutIsolationFinding,
  readCheckoutFacts,
} from './checkout-isolation.mjs';
import { renderBoard } from './coordination-board.mjs';
import { branchSlug, NO_BRANCH, NO_PR } from './coordination-parse.mjs';
import { mergedTaskDriftWarnings } from './coordination-reconcile.mjs';
import { overlapWarnings } from './coordination-overlap.mjs';
import { readEntries } from './coordination-read.mjs';
import {
  readRemoteClaims,
  withoutLocalDuplicates,
} from './coordination-remote.mjs';
import { branchErrors, ISO_DATE, taskErrors } from './coordination-schema.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const COORD_DIR = join(REPO_ROOT, 'docs', 'coordination');
const TASKS_DIR = join(COORD_DIR, 'tasks');
const BRANCHES_DIR = join(COORD_DIR, 'branches');
const BOARD_DOC = join(COORD_DIR, 'BOARD.md');

const STALE_DAYS = 14;
const GHOST_DAYS = 3;

const isLive = ({ data }) => data !== undefined && data.status !== 'done';

const checkTaskSchema = (tasks, problems) => {
  const seen = new Map();
  for (const task of tasks) {
    if (task.data === undefined) {
      problems.push(
        `${task.name}: no YAML frontmatter — copy tasks/_TEMPLATE.md.`,
      );
      continue;
    }
    for (const message of taskErrors(task, seen)) {
      problems.push(`${task.name}: ${message}.`);
    }
    if (task.data.id !== undefined) {
      seen.set(task.data.id, task.name);
    }
  }
};

const checkBranchSchema = (branches, problems) => {
  for (const branch of branches) {
    if (branch.data === undefined) {
      problems.push(
        `${branch.name}: no YAML frontmatter — copy branches/_TEMPLATE.md.`,
      );
      continue;
    }
    for (const message of branchErrors(branch)) {
      problems.push(`${branch.name}: ${message}.`);
    }
  }
};

/** Live tasks grouped by real (non-placeholder) branch → the task ids on it. */
const liveByBranch = (tasks) => {
  const byBranch = new Map();
  for (const { data } of tasks.filter(isLive)) {
    if (!NO_BRANCH.has(data.branch)) {
      byBranch.set(data.branch, [
        ...(byBranch.get(data.branch) ?? []),
        data.id,
      ]);
    }
  }
  return byBranch;
};

const undeclaredSharedWarning = (branch, ids, declared) =>
  ids.length > 1 && !declared.has(branch)
    ? `branch \`${branch}\` is shared by ${ids.length} active tasks (${ids.join(', ')}) ` +
      `but has no descriptor — add \`branches/${branchSlug(branch)}.md\` or move to independent branches.`
    : undefined;

const orphanBranchWarning = ({ name, data }, byBranch) =>
  data !== undefined && data.status !== 'done' && !byBranch.has(data.branch)
    ? `${name}: shared branch \`${data.branch}\` has no active task — delete the descriptor or add its tasks.`
    : undefined;

const checkSharedBranches = (tasks, branches, warnings) => {
  const declared = new Set(
    branches.filter(({ data }) => data).map(({ data }) => data.branch),
  );
  const byBranch = liveByBranch(tasks);
  for (const [branch, ids] of byBranch) {
    const warning = undeclaredSharedWarning(branch, ids, declared);
    if (warning) {
      warnings.push(warning);
    }
  }
  for (const branch of branches) {
    const warning = orphanBranchWarning(branch, byBranch);
    if (warning) {
      warnings.push(warning);
    }
  }
};

const checkStale = (tasks, warnings) => {
  const today = new Date();
  for (const { name, data } of tasks) {
    if (
      data === undefined ||
      data.status === 'done' ||
      !ISO_DATE.test(data.updated ?? '')
    ) {
      continue;
    }
    const days = Math.floor(
      (today - new Date(`${data.updated}T00:00:00Z`)) / 86_400_000,
    );
    if (days > STALE_DAYS) {
      warnings.push(
        `${name}: not updated in ${days} days (status \`${data.status}\`) — ` +
          'bump `updated:` or delete the file if the work has landed.',
      );
    }
  }
};

/**
 * A live task recording neither a real branch nor a PR is a "ghost" — nobody can
 * see the work in flight, and if it already merged nothing else flags it (this is
 * how a completed task sat `active` for days). Warns after a short grace period so
 * a freshly-filed claim isn't nagged before its first branch/PR.
 */
const checkGhostTasks = (tasks, warnings) => {
  const today = new Date();
  for (const { name, data } of tasks) {
    if (data === undefined || data.status === 'done') {
      continue;
    }
    const prless = data.pr === undefined || NO_PR.has(String(data.pr).trim());
    if (
      !NO_BRANCH.has(data.branch) ||
      !prless ||
      !ISO_DATE.test(data.updated ?? '')
    ) {
      continue;
    }
    const days = Math.floor(
      (today - new Date(`${data.updated}T00:00:00Z`)) / 86_400_000,
    );
    if (days >= GHOST_DAYS) {
      warnings.push(
        `${name}: ${days} day(s) with no branch or PR recorded (status \`${data.status}\`) — ` +
          'record `branch:`/`pr:` so others can see the work, or delete the file if it already merged.',
      );
    }
  }
};

const REF_PATHS = (branch) => [
  join('refs', 'heads', branch),
  join('refs', 'remotes', 'origin', branch),
];

/** Is `branch` in `.git/packed-refs`? Each line is `<sha> refs/heads/<name>`. */
const packedRefHas = (gitDir, branch) => {
  const packed = join(gitDir, 'packed-refs');
  if (!existsSync(packed)) {
    return false;
  }
  const wanted = new Set(REF_PATHS(branch).map((p) => p.replaceAll('\\', '/')));
  return readFileSync(packed, 'utf8')
    .split('\n')
    .some((line) => wanted.has(line.slice(line.indexOf(' ') + 1)));
};

/**
 * Best-effort ref check via the filesystem — no `git` subprocess, so nothing is
 * resolved through PATH. Lenient: if there's no plain `.git` directory (e.g. a
 * worktree, where it's a file), we can't tell, so we don't warn.
 */
const gitRefExists = (branch) => {
  const gitDir = join(REPO_ROOT, '.git');
  if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) {
    return true;
  }
  const looseExists = REF_PATHS(branch).some((ref) =>
    existsSync(join(gitDir, ref)),
  );
  return looseExists || packedRefHas(gitDir, branch);
};

const checkTaskBranches = (tasks, warnings) => {
  for (const { name, data } of tasks) {
    const branch = data?.branch;
    if (branch === undefined || NO_BRANCH.has(branch) || gitRefExists(branch)) {
      continue;
    }
    warnings.push(
      `${name}: branch \`${branch}\` resolves to no local or origin ref — fix the field, set it to \`(uncommitted)\`, or delete the task if the branch merged and was removed.`,
    );
  }
};

/**
 * Claims living on other branches, plus a line saying what was actually read.
 *
 * The line is not decoration. Overlap detection used to be silently local-only
 * (#233), so "0 warnings" and "I could not look" printed identically. Anything
 * this could not read becomes a warning rather than an omission.
 */
const gatherRemoteClaims = (tasks, warnings) => {
  if (process.argv.includes('--no-remote')) {
    return {
      claims: [],
      coverage: 'remote branches: not checked (--no-remote)',
      liveBranches: undefined,
    };
  }

  const { claims, readBranches, unavailable, unreadBranches } =
    readRemoteClaims({ cwd: REPO_ROOT });

  if (unavailable) {
    warnings.push(
      'could not reach `origin`, so claims on other branches were not read — ' +
        'overlap detection is local-only for this run.',
    );
    return {
      claims: [],
      coverage: 'remote branches: unreachable',
      liveBranches: undefined,
    };
  }

  if (unreadBranches.length > 0) {
    warnings.push(
      `no local ref for ${unreadBranches.length} live branch(es) (${unreadBranches.join(', ')}) — ` +
        'their claims were not read. Run `git fetch --prune` to see them.',
    );
  }

  return {
    claims: withoutLocalDuplicates({ localTasks: tasks, remoteClaims: claims }),
    coverage: `remote branches: ${readBranches.length} read, ${unreadBranches.length} unread`,
    // Every live origin branch (read + unread), for the merged-task reconciliation.
    liveBranches: [...readBranches, ...unreadBranches],
  };
};

const report = (warnings) => {
  const underActions = process.env.GITHUB_ACTIONS === 'true';
  for (const warning of warnings) {
    console.error(underActions ? `::warning::${warning}` : `  ⚠ ${warning}`);
  }
};

const main = () => {
  const tasks = readEntries(TASKS_DIR);
  const branches = readEntries(BRANCHES_DIR);

  if (process.argv.includes('--write-board')) {
    writeFileSync(BOARD_DOC, renderBoard(tasks, branches));
    console.log(
      `Wrote the local docs/coordination/BOARD.md view (gitignored) — ` +
        `${tasks.length} task(s), ${branches.length} shared branch(es).`,
    );
    return;
  }

  const problems = [];
  const warnings = [];
  // Remote claims feed overlap detection ONLY. Schema and unique-id stay local:
  // another branch's malformed task is their problem to fix, and must not fail
  // an unrelated PR.
  const remote = gatherRemoteClaims(tasks, warnings);
  checkTaskSchema(tasks, problems);
  checkBranchSchema(branches, problems);
  warnings.push(...overlapWarnings([...tasks, ...remote.claims]));
  checkSharedBranches(tasks, branches, warnings);
  checkStale(tasks, warnings);
  checkTaskBranches(tasks, warnings);
  checkGhostTasks(tasks, warnings);
  const isolation = checkoutIsolationFinding(readCheckoutFacts(REPO_ROOT));
  if (isolation !== undefined) {
    (isolation.severity === 'problem' ? problems : warnings).push(
      isolation.message,
    );
  }
  warnings.push(
    ...mergedTaskDriftWarnings({
      liveBranches: remote.liveBranches,
      noBranch: NO_BRANCH,
      noPr: NO_PR,
      refExists: gitRefExists,
      tasks,
    }),
  );

  if (warnings.length > 0) {
    console.error(`Coordination register — ${warnings.length} warning(s):\n`);
    report(warnings);
    console.error('');
  }

  if (problems.length > 0) {
    console.error('Coordination register is inconsistent:\n');
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error(
      `\n${problems.length} problem(s). The register is the canonical "who is working ` +
        'on what" — fix it in the same commit as the change that broke it.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Coordination register is consistent: ${tasks.length} task(s), ` +
      `${branches.length} shared branch(es), ${warnings.length} warning(s). ` +
      `${remote.coverage}, ${remote.claims.length} claim(s) read from them.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
