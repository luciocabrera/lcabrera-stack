/**
 * Pure classification for `housekeeping:prune` (see
 * ../housekeeping-prune.mjs). Given real git state joined with GitHub PR state,
 * it decides which local branches and worktrees are safe to delete — and, more
 * importantly, which are NOT. The safety rule is the whole point: a branch with
 * unique un-PR'd commits, a worktree with uncommitted changes, and any stash are
 * *reported*, never destroyed. That rule is why this is a separate, unit-tested
 * pure module rather than inline in the shell: the cost of it being wrong is
 * deleted work, so it is exercised without a repo in
 * housekeeping-prune.test.mjs.
 */

/** Trunk and release lines are never pruned, whatever their PR state says. */
const PROTECTED = /^(?:main|release-.*)$/u;

const MERGED_OR_CLOSED = new Set(['CLOSED', 'MERGED']);

/**
 * Collapse every PR that ever pointed at a branch into one verdict. A branch is
 * only deletable when it has at least one PR and *none* is still open — a single
 * open PR (a reopen, a re-target) keeps the branch alive. `undefined` means the
 * branch never had a PR, which is a different case the caller weighs against
 * whether the branch carries unique commits.
 */
export const summarizePrs = (prs) => {
  if (!Array.isArray(prs) || prs.length === 0) {
    return undefined;
  }
  const open = prs.find((pr) => String(pr.state).toUpperCase() === 'OPEN');
  if (open !== undefined) {
    return { number: open.number, state: 'OPEN' };
  }
  const last = prs.at(-1);
  return { number: last.number, state: String(last.state).toUpperCase() };
};

/**
 * A branch's fate. `uniqueCount` is the commit count on the branch but not on
 * `origin/main`; `undefined` means the comparison could not be made (no
 * `origin/main`), which is treated as "unknown" and kept, never guessed as zero.
 */
export const classifyBranch = ({
  isCheckedOut,
  isCurrent,
  keep,
  name,
  pr,
  uniqueCount,
}) => {
  if (PROTECTED.test(name)) {
    return { action: 'keep', reason: 'protected branch' };
  }
  if (keep?.has(name)) {
    return { action: 'keep', reason: 'explicitly kept' };
  }
  if (isCurrent) {
    return { action: 'keep', reason: 'current branch' };
  }
  if (isCheckedOut) {
    return { action: 'keep', reason: 'checked out in a worktree' };
  }
  if (pr !== undefined && MERGED_OR_CLOSED.has(pr.state)) {
    return {
      action: 'delete',
      reason: `PR #${pr.number} ${pr.state.toLowerCase()}`,
    };
  }
  if (pr !== undefined) {
    return { action: 'keep', reason: `PR #${pr.number} open` };
  }
  if (uniqueCount === 0) {
    return { action: 'delete', reason: 'no PR, no unique commits (cruft)' };
  }
  if (uniqueCount === undefined) {
    return {
      action: 'report',
      reason: 'no PR; could not compare to origin/main',
    };
  }
  return {
    action: 'report',
    reason: `no PR, ${uniqueCount} unique commit(s) — review before deleting`,
  };
};

/**
 * A worktree's fate. The primary checkout is never removed. A dirty worktree is
 * reported, never removed — its uncommitted changes are exactly the work this
 * command exists not to lose.
 */
export const classifyWorktree = ({ branch, dirty, isPrimary, pr }) => {
  if (isPrimary) {
    return { action: 'keep', reason: 'primary checkout' };
  }
  if (dirty) {
    return {
      action: 'report',
      reason: 'uncommitted changes — resolve manually',
    };
  }
  if (branch === undefined) {
    return { action: 'report', reason: 'detached HEAD — resolve manually' };
  }
  if (pr !== undefined && MERGED_OR_CLOSED.has(pr.state)) {
    return {
      action: 'remove',
      reason: `branch ${branch} merged (PR #${pr.number})`,
    };
  }
  return {
    action: 'keep',
    reason: pr === undefined ? 'branch not merged' : `PR #${pr.number} open`,
  };
};

/**
 * Parse `git worktree list --porcelain` into records. The first entry is always
 * the primary checkout. Branch is `undefined` for a detached or bare worktree.
 */
export const parseWorktrees = (porcelain) => {
  if (!porcelain) {
    return [];
  }
  return porcelain
    .split(/\n\s*\n/u)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split('\n');
      const path = lines
        .find((line) => line.startsWith('worktree '))
        ?.slice('worktree '.length);
      const branchRef = lines
        .find((line) => line.startsWith('branch '))
        ?.slice('branch refs/heads/'.length);
      return { branch: branchRef, isPrimary: index === 0, path };
    })
    .filter((entry) => entry.path !== undefined);
};

/** Join classifications into the buckets the shell prints and (with --apply) acts on. */
export const buildPlan = ({
  branches,
  checkedOutBranches,
  currentBranch,
  keep,
  prByHead,
  stashes,
  uniqueByBranch,
  worktrees,
}) => {
  const branchVerdicts = branches.map((name) => ({
    name,
    ...classifyBranch({
      isCheckedOut: checkedOutBranches.has(name),
      isCurrent: name === currentBranch,
      keep,
      name,
      pr: prByHead.get(name),
      uniqueCount: uniqueByBranch.get(name),
    }),
  }));
  const worktreeVerdicts = worktrees.map((worktree) => ({
    ...worktree,
    ...classifyWorktree({
      ...worktree,
      pr:
        worktree.branch === undefined
          ? undefined
          : prByHead.get(worktree.branch),
    }),
  }));
  return {
    deleteBranches: branchVerdicts.filter((entry) => entry.action === 'delete'),
    removeWorktrees: worktreeVerdicts.filter(
      (entry) => entry.action === 'remove',
    ),
    reportBranches: branchVerdicts.filter((entry) => entry.action === 'report'),
    reportWorktrees: worktreeVerdicts.filter(
      (entry) => entry.action === 'report',
    ),
    stashes,
  };
};
