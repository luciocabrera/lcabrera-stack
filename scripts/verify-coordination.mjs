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
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  branchSlug,
  globsOverlap,
  parseFrontmatter,
} from './lib/coordination-parse.mjs';
import {
  boardTuple,
  parseBoard,
  renderBoard,
} from './lib/coordination-board.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const COORD_DIR = join(REPO_ROOT, 'docs', 'coordination');
const TASKS_DIR = join(COORD_DIR, 'tasks');
const BRANCHES_DIR = join(COORD_DIR, 'branches');
const BOARD_DOC = join(COORD_DIR, 'BOARD.md');
const BOARD_REL = 'docs/coordination/BOARD.md';

const STALE_DAYS = 14;
const STATUSES = new Set(['active', 'blocked', 'review', 'paused', 'done']);
const BRANCH_STATUSES = new Set(['active', 'merging', 'done']);
const TASK_REQUIRED = [
  'id',
  'title',
  'owner',
  'status',
  'branch',
  'area',
  'started',
  'updated',
];
const BRANCH_REQUIRED = [
  'branch',
  'base',
  'target',
  'integrator',
  'status',
  'updated',
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OWNER = /^(agent|human):.+/;
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
  for (const { name, slug, data } of tasks) {
    if (data === undefined) {
      problems.push(`${name}: no YAML frontmatter — copy tasks/_TEMPLATE.md.`);
      continue;
    }
    for (const field of TASK_REQUIRED) {
      const value = data[field];
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        problems.push(`${name}: missing required field \`${field}\`.`);
      }
    }
    if (data.status !== undefined && !STATUSES.has(data.status)) {
      problems.push(
        `${name}: status \`${data.status}\` is not one of ${[...STATUSES].join(', ')}.`,
      );
    }
    if (data.owner !== undefined && !OWNER.test(data.owner)) {
      problems.push(
        `${name}: owner \`${data.owner}\` must look like \`agent:<name>\` or \`human:<name>\`.`,
      );
    }
    if (data.id !== undefined && data.id !== slug) {
      problems.push(
        `${name}: id \`${data.id}\` must match the filename slug \`${slug}\`.`,
      );
    }
    for (const field of ['started', 'updated']) {
      if (data[field] !== undefined && !ISO_DATE.test(data[field])) {
        problems.push(
          `${name}: ${field} \`${data[field]}\` is not YYYY-MM-DD.`,
        );
      }
    }
    const prior = data.id !== undefined && seen.get(data.id);
    if (prior) {
      problems.push(`${name}: duplicate id \`${data.id}\` (also in ${prior}).`);
    }
    if (data.id !== undefined) {
      seen.set(data.id, name);
    }
  }
};

const checkBranchSchema = (branches, problems) => {
  for (const { name, slug, data } of branches) {
    if (data === undefined) {
      problems.push(
        `${name}: no YAML frontmatter — copy branches/_TEMPLATE.md.`,
      );
      continue;
    }
    for (const field of BRANCH_REQUIRED) {
      if (data[field] === undefined) {
        problems.push(`${name}: missing required field \`${field}\`.`);
      }
    }
    if (data.status !== undefined && !BRANCH_STATUSES.has(data.status)) {
      problems.push(
        `${name}: status \`${data.status}\` is not one of ${[...BRANCH_STATUSES].join(', ')}.`,
      );
    }
    if (data.integrator !== undefined && !OWNER.test(data.integrator)) {
      problems.push(
        `${name}: integrator \`${data.integrator}\` must look like \`agent:<name>\` or \`human:<name>\`.`,
      );
    }
    if (data.updated !== undefined && !ISO_DATE.test(data.updated)) {
      problems.push(`${name}: updated \`${data.updated}\` is not YYYY-MM-DD.`);
    }
    if (data.branch !== undefined && slug !== branchSlug(data.branch)) {
      problems.push(
        `${name}: filename must be the branch slug \`${branchSlug(data.branch)}.md\`.`,
      );
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

const checkSharedBranches = (tasks, branches, warnings) => {
  const declared = new Set(
    branches.filter(({ data }) => data).map(({ data }) => data.branch),
  );
  const byBranch = new Map();
  for (const task of tasks.filter(isLive)) {
    const { branch } = task.data;
    if (NO_BRANCH.has(branch)) {
      continue;
    }
    byBranch.set(branch, [...(byBranch.get(branch) ?? []), task.data.id]);
  }
  for (const [branch, ids] of byBranch) {
    if (ids.length > 1 && !declared.has(branch)) {
      warnings.push(
        `branch \`${branch}\` is shared by ${ids.length} active tasks (${ids.join(', ')}) ` +
          `but has no descriptor — add \`branches/${branchSlug(branch)}.md\` or move to independent branches.`,
      );
    }
  }
  for (const { name, data } of branches) {
    if (
      data !== undefined &&
      data.status !== 'done' &&
      !byBranch.has(data.branch)
    ) {
      warnings.push(
        `${name}: shared branch \`${data.branch}\` has no active task — delete the descriptor or add its tasks.`,
      );
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

/** Best-effort: git may be unavailable (shallow CI), so failure to resolve is silent. */
const gitRefExists = (branch) => {
  for (const ref of [`refs/heads/${branch}`, `refs/remotes/origin/${branch}`]) {
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
        cwd: REPO_ROOT,
        stdio: 'ignore',
      });
      return true;
    } catch {
      // try the next ref form
    }
  }
  return false;
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
