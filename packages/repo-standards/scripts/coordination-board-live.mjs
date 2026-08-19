/**
 * A LIVE coordination view: joins the static claims (task files) with the real
 * state of open pull requests from GitHub. Where `BOARD.md` answers "who claimed
 * what" (and can go stale), this answers "what's actually in flight right now" —
 * which claim maps to which PR, whether it's a draft, and whether its checks are
 * green. It also surfaces **open PRs with no coordination task** (unregistered
 * work) and **claims whose branch has no open PR** (likely merged — close them).
 *
 * WHY IT READS STDIN
 * ------------------
 * The `gh pr list` call lives in the `coordination:board:live` package.json
 * script and is piped in; this file never spawns a subprocess. That keeps it off
 * the "OS command resolved via PATH" hotspot (Sonar S4036) the same way
 * `generate-changelog.mjs` takes `git log` on stdin. Prints to stdout only — it
 * never writes `BOARD.md` (that stays a gitignored, local-only view — ADR-037).
 *
 * Usage:
 *   gh pr list --state open --json number,title,headRefName,isDraft,url,statusCheckRollup \
 *     | repo-claim-board
 *
 * With no PR JSON on stdin (no `gh`, no token, no open PRs) it still prints the
 * claims, just without live PR columns. Exit code is always 0 — it is a view.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readStdin } from './cli-input.mjs';
import { readRegisters } from './config.mjs';
import { readEntries } from './coordination-read.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const TASKS_DIR = resolve(REPO_ROOT, readRegisters().coordinationTasksDir);

const parsePullRequests = (raw) => {
  if (!raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    process.stderr.write(
      '  ⚠ could not parse `gh pr list` JSON — showing claims only.\n',
    );
    return [];
  }
};

const FAILING = new Set([
  'FAILURE',
  'ERROR',
  'TIMED_OUT',
  'CANCELLED',
  'ACTION_REQUIRED',
]);
const DONE = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED']);

/** Roll a PR's check runs up to one glyph: red > pending > green > none. */
const checksGlyph = (rollup) => {
  if (!Array.isArray(rollup) || rollup.length === 0) {
    return '·';
  }
  const states = rollup.map((c) =>
    String(c.conclusion || c.state || c.status || '').toUpperCase(),
  );
  if (states.some((s) => FAILING.has(s))) {
    return '🔴';
  }
  if (states.some((s) => !DONE.has(s))) {
    return '🟡';
  }
  return '✅';
};

/** Match a claim to an open PR by branch first, then by its recorded pr number. */
const prForTask = (data, byBranch, byNumber) =>
  byBranch.get(data.branch) ??
  (data.pr === undefined ? undefined : byNumber.get(String(data.pr).trim()));

const prCell = (pr) => {
  if (pr === undefined) {
    return '—';
  }
  const kind = pr.isDraft ? '📝draft' : '🟢open';
  return `#${pr.number} ${kind} ${checksGlyph(pr.statusCheckRollup)}`;
};

const pad = (rows) => {
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => r[i].length)),
  );
  return rows.map((r) => r.map((c, i) => c.padEnd(widths[i])).join('  '));
};

const printClaims = (tasks, byBranch, byNumber) => {
  const header = ['Task', 'Owner', 'Status', 'Branch', 'PR', 'Updated'];
  const body = tasks
    .filter(({ data }) => data !== undefined)
    .map(({ data }) => [
      data.id,
      data.owner ?? '',
      data.status ?? '',
      data.branch ?? '',
      prCell(prForTask(data, byBranch, byNumber)),
      data.updated ?? '',
    ]);
  if (body.length === 0) {
    process.stdout.write('  (no active claims)\n');
    return;
  }
  const [head, ...lines] = pad([header, ...body]);
  process.stdout.write(
    `${head}\n${'-'.repeat(head.length)}\n${lines.join('\n')}\n`,
  );
};

const printUnclaimedPrs = (pullRequests, claimedBranches) => {
  const orphans = pullRequests.filter(
    (pr) => !claimedBranches.has(pr.headRefName),
  );
  if (orphans.length === 0) {
    return;
  }
  process.stdout.write(
    '\nOpen PRs with no coordination task (unregistered work):\n',
  );
  for (const pr of orphans) {
    process.stdout.write(
      `  #${pr.number} ${pr.isDraft ? '📝' : '🟢'} ${pr.headRefName} — ${pr.title}\n`,
    );
  }
};

const main = async () => {
  const tasks = readEntries(TASKS_DIR);
  const pullRequests = parsePullRequests(await readStdin());
  const byBranch = new Map(pullRequests.map((pr) => [pr.headRefName, pr]));
  const byNumber = new Map(pullRequests.map((pr) => [String(pr.number), pr]));

  process.stdout.write('Coordination — live view (claims × open PRs)\n\n');
  printClaims(tasks, byBranch, byNumber);
  printUnclaimedPrs(
    pullRequests,
    new Set(tasks.map(({ data }) => data?.branch).filter(Boolean)),
  );
};

await main();
