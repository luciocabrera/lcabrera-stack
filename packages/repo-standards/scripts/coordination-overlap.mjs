/**
 * The register's soft lock: two live claims on DIFFERENT branches whose `area`
 * globs intersect are a real collision and warrant a warning. Same-branch
 * overlap is deliberate collaboration and is never warned about.
 *
 * Split out of `verify-coordination.mjs` so the rule is unit-testable. It is
 * the check that #233 was about — it was silently only ever comparing claims
 * that happened to be in one working tree, so the answer it gave was shaped by
 * which branch you ran it from. A rule that important should be provable
 * without running the whole gate.
 *
 * Pure: no fs, no git, no clock. Entries are `{ name, data }`, the same shape
 * `coordination-read.mjs` produces and `coordination-remote.mjs` mirrors for
 * claims read off other branches.
 */
import { globsOverlap } from './coordination-parse.mjs';

export const NO_BRANCH = new Set(['(none)', '(uncommitted)', '(worktree)']);

const isLive = ({ data }) => data !== undefined && data.status !== 'done';

const firstClash = (a, b) =>
  a.area?.find((x) => b.area?.some((y) => globsOverlap(x, y)));

const isSameBranch = (a, b) =>
  a.branch === b.branch && !NO_BRANCH.has(a.branch);

/** @returns {string[]} */
const warningsAgainst = ({ from, live }) =>
  live.slice(from + 1).flatMap((other) => {
    const a = live[from].data;
    const b = other.data;
    if (isSameBranch(a, b)) return [];
    const clash = firstClash(a, b);
    if (clash === undefined) return [];
    return [
      `${live[from].name} and ${other.name} claim overlapping areas ` +
        `(e.g. \`${clash}\`) on different branches — narrow a glob, serialise, ` +
        'or share one branch (branches/<slug>.md).',
    ];
  });

export const overlapWarnings = (tasks) => {
  const live = tasks.filter((value) => isLive(value));
  const warnings = [];
  for (let i = 0; i < live.length; i += 1) {
    warnings.push(...warningsAgainst({ from: i, live }));
  }
  return warnings;
};
