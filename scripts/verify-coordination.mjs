/**
 * Verifies the in-git work register under `docs/coordination/` — the canonical
 * "who is working on what" for this monorepo.
 *
 * Why this exists: multiple agents (Claude, Copilot, Gemini) and humans work
 * this repo in parallel, but the only signals that any work was in flight were
 * `git branch -vv` (a name and a commit — no owner, status, or the files it
 * touches) and per-agent scratch in `~/.claude/plans/` (opaque names, invisible
 * to everyone else). That is how one agent nearly edited the column-resize code
 * another agent already owned: nothing in the repo could have warned it. The
 * register fixes that by making the claim live in git; this script keeps the
 * register honest the same way `verify-commands-doc.mjs` keeps COMMANDS.md honest.
 *
 * Each active task is one file: `docs/coordination/tasks/<id>.md`, with YAML
 * frontmatter (id, title, owner, status, branch, area globs, started, updated).
 * `_TEMPLATE.md` and any `_*`-prefixed file are ignored.
 *
 * Checks (ERROR fails the build; WARN is surfaced but never blocks — a warning
 * must not fail an unrelated PR just because someone else's task drifted):
 *   ERROR  schema      — every task file has the required fields, a valid status,
 *                        an `agent:`/`human:` owner, ≥1 area glob, ISO dates, and
 *                        an id matching its filename.
 *   ERROR  unique-id   — no two task files share an id.
 *   ERROR  board-sync  — BOARD.md's rows match the task files (compared as parsed
 *                        DATA, not text, so Oxfmt reflowing the table is invisible;
 *                        a genuinely missing/extra/mislabelled row fails). Fix with
 *                        `vp run coordination:board`.
 *   WARN   overlap     — two non-done tasks declare intersecting area globs. This
 *                        is the collision signal; resolve by narrowing a glob or
 *                        serialising the work.
 *   WARN   stale       — a non-done task's `updated:` is older than STALE_DAYS.
 *                        Bump it or close the task (delete the file once merged).
 *   WARN   branch      — a task's branch resolves to no local/remote ref. Best
 *                        effort: skipped silently when git can't be consulted
 *                        (e.g. a shallow CI checkout), so it never false-fails.
 *
 * Modes:
 *   node scripts/verify-coordination.mjs                 → verify (default)
 *   node scripts/verify-coordination.mjs --write-board   → regenerate BOARD.md
 *
 * Exit codes: 0 = register is consistent (warnings allowed), 1 = an ERROR check
 * failed (every problem is listed, not just the first).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const COORD_DIR = join(REPO_ROOT, 'docs', 'coordination');
const TASKS_DIR = join(COORD_DIR, 'tasks');
const BOARD_DOC = join(COORD_DIR, 'BOARD.md');
const BOARD_REL = 'docs/coordination/BOARD.md';

const STALE_DAYS = 14;
const STATUSES = new Set(['active', 'blocked', 'review', 'paused', 'done']);
const REQUIRED = [
  'id',
  'title',
  'owner',
  'status',
  'branch',
  'area',
  'started',
  'updated',
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NO_BRANCH = new Set(['(uncommitted)', '(none)', '(worktree)']);

/**
 * A frontmatter parser small enough to own: scalars are `key: value`, and a
 * `key:` with an empty value opens a `- item` list (only `area` uses one). No
 * nesting beyond that is allowed by the schema, so nothing more is needed.
 */
const parseFrontmatter = (source) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  if (match === null) {
    return undefined;
  }
  const data = {};
  let listKey;
  for (const raw of match[1].split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(raw);
    if (item !== null && listKey !== undefined) {
      data[listKey].push(item[1].trim());
      continue;
    }
    const pair = /^([A-Za-z]\w*):\s*(.*)$/.exec(raw);
    if (pair === null) {
      continue;
    }
    const [, key, value] = pair;
    if (value === '') {
      data[key] = [];
      listKey = key;
      continue;
    }
    data[key] = value.trim();
    listKey = undefined;
  }
  return data;
};

/** Every task file's parsed frontmatter, keyed by filename for error messages. */
const readTasks = () =>
  readdirSync(TASKS_DIR)
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .map((name) => ({
      name,
      slug: name.replace(/\.md$/, ''),
      data: parseFrontmatter(readFileSync(join(TASKS_DIR, name), 'utf8')),
    }));

const checkSchema = (tasks, problems) => {
  const seen = new Map();
  for (const { name, slug, data } of tasks) {
    if (data === undefined) {
      problems.push(`${name}: no YAML frontmatter — copy tasks/_TEMPLATE.md.`);
      continue;
    }
    for (const field of REQUIRED) {
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
    if (data.owner !== undefined && !/^(agent|human):.+/.test(data.owner)) {
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
    if (data.id !== undefined) {
      const prior = seen.get(data.id);
      if (prior !== undefined) {
        problems.push(
          `${name}: duplicate id \`${data.id}\` (also in ${prior}).`,
        );
      }
      seen.set(data.id, name);
    }
  }
};

/**
 * Glob intersection over path segments: `*` matches one segment, `**` matches
 * zero or more. Returns true when some concrete path could match both globs —
 * exactly the question "do these two areas overlap?".
 */
const segmentsIntersect = (a, b) => {
  if (a.length === 0 && b.length === 0) {
    return true;
  }
  if (a[0] === '**') {
    return (
      segmentsIntersect(a.slice(1), b) ||
      (b.length > 0 && segmentsIntersect(a, b.slice(1)))
    );
  }
  if (b[0] === '**') {
    return (
      segmentsIntersect(a, b.slice(1)) ||
      (a.length > 0 && segmentsIntersect(a.slice(1), b))
    );
  }
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  if (a[0] === '*' || b[0] === '*' || a[0] === b[0]) {
    return segmentsIntersect(a.slice(1), b.slice(1));
  }
  return false;
};

const globsOverlap = (x, y) =>
  segmentsIntersect(
    x.replace(/^\.\//, '').split('/'),
    y.replace(/^\.\//, '').split('/'),
  );

const checkOverlap = (tasks, warnings) => {
  const live = tasks.filter(
    ({ data }) => data !== undefined && data.status !== 'done',
  );
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const clash = live[i].data.area.find((x) =>
        live[j].data.area.some((y) => globsOverlap(x, y)),
      );
      if (clash !== undefined) {
        warnings.push(
          `${live[i].name} and ${live[j].name} claim overlapping areas ` +
            `(e.g. \`${clash}\`) — narrow a glob or serialise the work.`,
        );
      }
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
          `bump \`updated:\` or delete the file if the work has landed.`,
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

const checkBranches = (tasks, warnings) => {
  for (const { name, data } of tasks) {
    const branch = data?.branch;
    if (branch === undefined || NO_BRANCH.has(branch) || gitRefExists(branch)) {
      continue;
    }
    warnings.push(
      `${name}: branch \`${branch}\` resolves to no local or origin ref — ` +
        `fix the field, or set it to \`(uncommitted)\`.`,
    );
  }
};

/** One row of board data — the fields that define "who is working on what". */
const boardTuple = (data) =>
  [data.id, data.status, data.owner, data.branch].join(' | ');

const renderBoard = (tasks) => {
  const rows = tasks
    .filter(({ data }) => data !== undefined)
    .map(({ data }) => data)
    .sort(
      (a, b) => a.status.localeCompare(b.status) || a.id.localeCompare(b.id),
    );

  const header =
    '# Coordination board\n\n' +
    '> Generated by `vp run coordination:board` from `tasks/*.md`. Do not hand-edit —\n' +
    '> edit the task file, then regenerate. `vp run coordination:verify` fails if this\n' +
    '> drifts. See [README.md](./README.md) for the protocol.\n\n';

  if (rows.length === 0) {
    return `${header}_No active tasks. Claim one by copying \`tasks/_TEMPLATE.md\`._\n`;
  }

  const body = rows
    .map(
      (d) =>
        `| [${d.title}](tasks/${d.id}.md) | ${d.owner} | ${d.status} | ` +
        `\`${d.branch}\` | ${d.area.map((a) => `\`${a}\``).join('<br>')} | ${d.updated} |`,
    )
    .join('\n');

  return (
    `${header}| Task | Owner | Status | Branch | Area | Updated |\n` +
    `| ---- | ----- | ------ | ------ | ---- | ------- |\n${body}\n`
  );
};

/** Parse the committed board back into the same tuples, ignoring formatting. */
const readBoardTuples = () => {
  const doc = readFileSync(BOARD_DOC, 'utf8');
  const tuples = new Set();
  for (const line of doc.split('\n')) {
    const id = /\]\(tasks\/([\w-]+)\.md\)/.exec(line)?.[1];
    if (id === undefined) {
      continue;
    }
    const cells = line.split('|').map((c) => c.trim());
    // cells: ['', task, owner, status, branch, area, updated, '']
    tuples.add(
      [id, cells[3], cells[2], cells[4]?.replace(/`/g, '')].join(' | '),
    );
  }
  return tuples;
};

const checkBoardSync = (tasks, problems) => {
  const expected = new Set(
    tasks
      .filter(({ data }) => data !== undefined)
      .map(({ data }) => boardTuple(data)),
  );
  const actual = readBoardTuples();
  for (const tuple of expected) {
    if (!actual.has(tuple)) {
      problems.push(
        `${BOARD_REL} is missing/stale for task \`${tuple.split(' | ')[0]}\` — run \`vp run coordination:board\`.`,
      );
    }
  }
  for (const tuple of actual) {
    if (!expected.has(tuple)) {
      problems.push(
        `${BOARD_REL} has a phantom row \`${tuple.split(' | ')[0]}\` with no matching task file — run \`vp run coordination:board\`.`,
      );
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
  const tasks = readTasks();

  if (process.argv.includes('--write-board')) {
    writeFileSync(BOARD_DOC, renderBoard(tasks));
    console.log(`Wrote ${BOARD_REL} (${tasks.length} task(s)).`);
    return;
  }

  const problems = [];
  const warnings = [];
  checkSchema(tasks, problems);
  checkBoardSync(tasks, problems);
  checkOverlap(tasks, warnings);
  checkStale(tasks, warnings);
  checkBranches(tasks, warnings);

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
      `${warnings.length} warning(s).`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
