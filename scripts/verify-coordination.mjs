/**
 * Verifies the in-git work register under `docs/coordination/` — the canonical
 * "who is working on what" for this monorepo. Keeps the register honest the same
 * way `verify-commands-doc.mjs` keeps COMMANDS.md honest. Pure parsing/rendering
 * live in `./lib/coordination-parse.mjs` and `./lib/coordination-board.mjs`; this
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
 * Checks (ERROR fails the build; WARN is surfaced but never blocks — a warning
 * must not fail an unrelated PR because someone else's task drifted):
 *   ERROR  schema        — task/branch files have the required, well-typed fields
 *                          and an id/slug matching the filename.
 *   ERROR  unique-id     — no two task files share an id.
 *   ERROR  board-sync    — BOARD.md matches the task + branch files (compared as
 *                          DATA, not text). Fix with `vp run coordination:board`.
 *   WARN   overlap       — two non-done tasks on DIFFERENT branches claim
 *                          intersecting areas (a real collision). Same-branch
 *                          overlap is intended collaboration and is not warned.
 *   WARN   shared-branch — 2+ active tasks share a branch with no descriptor
 *                          (declare it or split), or a descriptor has no tasks.
 *   WARN   stale         — a non-done task's `updated:` is older than STALE_DAYS.
 *   WARN   branch        — a task's branch resolves to no local/remote ref.
 *
 * Modes:
 *   node scripts/verify-coordination.mjs                 → verify (default)
 *   node scripts/verify-coordination.mjs --write-board   → regenerate BOARD.md
 *
 * Exit codes: 0 = consistent (warnings allowed), 1 = an ERROR check failed.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  boardTuple,
  parseBoard,
  renderBoard,
} from './lib/coordination-board.mjs';
import {
  branchSlug,
  globsOverlap,
  parseFrontmatter,
} from './lib/coordination-parse.mjs';
import {
  branchErrors,
  ISO_DATE,
  taskErrors,
} from './lib/coordination-schema.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const COORD_DIR = join(REPO_ROOT, 'docs', 'coordination');
const TASKS_DIR = join(COORD_DIR, 'tasks');
const BRANCHES_DIR = join(COORD_DIR, 'branches');
const BOARD_DOC = join(COORD_DIR, 'BOARD.md');
const BOARD_REL = 'docs/coordination/BOARD.md';

const STALE_DAYS = 14;
const NO_BRANCH = new Set(['(uncommitted)', '(none)', '(worktree)']);

/** Parsed `.md` files in a register dir (missing dir → none). */
const readEntries = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('_'),
        )
        .map((e) => ({
          name: e.name,
          slug: e.name.replace(/\.md$/, ''),
          data: parseFrontmatter(readFileSync(join(dir, e.name), 'utf8')),
        }))
    : [];

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

/** Overlap only warns ACROSS branches — same-branch overlap is collaboration. */
const checkOverlap = (tasks, warnings) => {
  const live = tasks.filter(isLive);
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i].data;
      const b = live[j].data;
      if (a.branch === b.branch && !NO_BRANCH.has(a.branch)) {
        continue;
      }
      const clash = a.area.find((x) => b.area.some((y) => globsOverlap(x, y)));
      if (clash !== undefined) {
        warnings.push(
          `${live[i].name} and ${live[j].name} claim overlapping areas ` +
            `(e.g. \`${clash}\`) on different branches — narrow a glob, serialise, ` +
            'or share one branch (branches/<slug>.md).',
        );
      }
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
  const wanted = new Set(REF_PATHS(branch).map((p) => p.split('\\').join('/')));
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
      `${name}: branch \`${branch}\` resolves to no local or origin ref — fix the field, or set it to \`(uncommitted)\`.`,
    );
  }
};

const checkBoardSync = (tasks, branches, problems) => {
  const expectedTasks = new Set(
    tasks
      .filter(({ data }) => data !== undefined)
      .map(({ data }) => boardTuple(data)),
  );
  const expectedBranches = new Set(
    branches.filter(({ data }) => data !== undefined).map(({ slug }) => slug),
  );
  const actual = parseBoard(readFileSync(BOARD_DOC, 'utf8'));
  const fix = `run \`vp run coordination:board\``;
  for (const t of expectedTasks) {
    if (!actual.tasks.has(t)) {
      problems.push(
        `${BOARD_REL} is missing/stale for task \`${t.split(' | ')[0]}\` — ${fix}.`,
      );
    }
  }
  for (const t of actual.tasks) {
    if (!expectedTasks.has(t)) {
      problems.push(
        `${BOARD_REL} has a phantom task row \`${t.split(' | ')[0]}\` — ${fix}.`,
      );
    }
  }
  for (const s of expectedBranches) {
    if (!actual.branches.has(s)) {
      problems.push(`${BOARD_REL} is missing shared branch \`${s}\` — ${fix}.`);
    }
  }
  for (const s of actual.branches) {
    if (!expectedBranches.has(s)) {
      problems.push(`${BOARD_REL} has a phantom branch row \`${s}\` — ${fix}.`);
    }
  }
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
      `Wrote ${BOARD_REL} (${tasks.length} task(s), ${branches.length} shared branch(es)).`,
    );
    return;
  }

  const problems = [];
  const warnings = [];
  checkTaskSchema(tasks, problems);
  checkBranchSchema(branches, problems);
  checkBoardSync(tasks, branches, problems);
  checkOverlap(tasks, warnings);
  checkSharedBranches(tasks, branches, warnings);
  checkStale(tasks, warnings);
  checkTaskBranches(tasks, warnings);

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
      `${branches.length} shared branch(es), ${warnings.length} warning(s).`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
