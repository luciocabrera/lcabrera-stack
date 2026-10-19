/*
 * What `devkit worktrees` does with each linked worktree and each throwaway
 * container, decided from facts already gathered. Pure, so the rule that keeps
 * uncommitted work alive is tested without a repository.
 *
 * A worktree with a change that matches no history is kept under every flag.
 * An unknown pull-request state keeps a worktree whose fate depends on it.
 */

const PR_MERGED = 'MERGED';
const PR_OPEN = 'OPEN';
const PR_CLOSED = 'CLOSED';
const PR_NONE = 'NONE';
const PR_UNKNOWN = 'UNKNOWN';

export const PR_STATES = Object.freeze({
  closed: PR_CLOSED,
  merged: PR_MERGED,
  none: PR_NONE,
  open: PR_OPEN,
  unknown: PR_UNKNOWN,
});

const keep = (reason) => ({
  action: 'keep',
  deleteBranch: false,
  force: false,
  reason,
});

const remove = ({ deleteBranch = false, force = false, reason }) => ({
  action: 'remove',
  deleteBranch,
  force,
  reason,
});

const prLabel = (pr) => `PR #${pr.number}`;

const branchCarriedByMerge = ({ head, onBase, pr }) =>
  pr.state === PR_MERGED && (onBase || head === pr.headRefOid);

const dirtySummary = ({ base, counts, untracked }) =>
  `${counts.base} match ${base}, ${counts.branch} match its own history, ${counts.neither} match neither, ${untracked} untracked`;

const planDirty = ({ facts, options }) => {
  const summary = dirtySummary({ base: options.base, ...facts });
  if (facts.counts.neither > 0 || facts.untracked > 0) {
    return keep(`dirty: ${summary}`);
  }
  if (!options.includeSuperseded) {
    return keep(
      `dirty, every change already in history (${summary}) — --include-superseded removes it`,
    );
  }
  return remove({
    deleteBranch: facts.branch !== undefined && branchCarriedByMerge(facts),
    force: true,
    reason: `superseded: ${summary}`,
  });
};

const planDetached = ({ facts, options }) => {
  if (facts.onBase)
    return remove({ reason: `its commit is on ${options.base}` });
  if (facts.pr.state === PR_MERGED) {
    return remove({
      reason: `its commit is the head of merged ${prLabel(facts.pr)}`,
    });
  }
  if (facts.pr.state === PR_UNKNOWN) {
    return keep(
      `detached on a commit ${options.base} does not contain, and no pull request state: ${facts.pr.reason}`,
    );
  }
  return keep(`detached on a commit ${options.base} does not contain`);
};

const BRANCH_RULES = {
  [PR_CLOSED]: ({ pr }) =>
    remove({ reason: `${prLabel(pr)} closed unmerged; the branch is kept` }),
  [PR_MERGED]: (facts) =>
    remove(
      branchCarriedByMerge(facts)
        ? { deleteBranch: true, reason: `${prLabel(facts.pr)} merged` }
        : {
            reason: `${prLabel(facts.pr)} merged, but the branch has commits it did not carry; the branch is kept`,
          },
    ),
  [PR_NONE]: () => remove({ reason: 'no pull request; the branch is kept' }),
  [PR_OPEN]: ({ pr }) => keep(`${prLabel(pr)} open`),
  [PR_UNKNOWN]: ({ pr }) => keep(`pull request state unknown: ${pr.reason}`),
};

const planOnBranch = ({ facts, options }) =>
  facts.branch === options.baseBranch
    ? keep('the default branch')
    : BRANCH_RULES[facts.pr.state](facts);

const decide = ({ facts, options }) => {
  if (facts.locked) return keep('locked');
  if (!facts.clean) return planDirty({ facts, options });
  return facts.branch === undefined
    ? planDetached({ facts, options })
    : planOnBranch({ facts, options });
};

/**
 * @param {{ facts: object[], options: { base: string, baseBranch: string,
 *   includeSuperseded: boolean } }} args
 */
export const planWorktrees = ({ facts, options }) =>
  facts.map((entry) => ({ ...entry, ...decide({ facts: entry, options }) }));

const isGone = ({ isOnDisk, live, worktree }) =>
  worktree !== '' && !live.has(worktree) && !isOnDisk(worktree);

/**
 * @param {{ containers: { id: string, name: string, running: boolean,
 *   worktree: string }[], isOnDisk: (path: string) => boolean,
 *   live: Set<string> }} args
 */
export const planContainers = ({ containers, isOnDisk, live }) =>
  containers.map((container) => {
    if (!container.running) {
      return { ...container, action: 'remove', reason: 'stopped' };
    }
    if (isGone({ isOnDisk, live, worktree: container.worktree })) {
      return {
        ...container,
        action: 'remove',
        reason: `orphaned: ${container.worktree} is gone`,
      };
    }
    return { ...container, action: 'keep', reason: 'running' };
  });

const where = ({ branch, head }) =>
  branch === undefined ? `detached at ${head.slice(0, 12)}` : branch;

const verb = ({ action, deleteBranch }) => {
  if (action === 'keep') return 'keep';
  return deleteBranch ? 'remove + delete branch' : 'remove';
};

/**
 * @param {{ apply: boolean, containers: object[], notes: string[],
 *   prunable: string[], worktrees: object[] }} plan
 */
export const renderPlan = ({
  apply,
  containers,
  notes,
  prunable,
  worktrees,
}) => [
  apply ? 'Applying this plan:' : 'Plan (nothing changes until --apply):',
  ...(worktrees.length === 0 ? ['  no linked worktrees'] : []),
  ...worktrees.map(
    (entry) =>
      `  ${verb(entry).padEnd(22)} ${entry.path} (${where(entry)}) — ${entry.reason}`,
  ),
  ...prunable.map(
    (path) => `  ${'prune'.padEnd(22)} ${path} — its directory is gone`,
  ),
  ...containers.map((entry) => {
    const label = `${entry.action} container`;
    return `  ${label.padEnd(22)} ${entry.name} — ${entry.reason}`;
  }),
  ...notes.map((note) => `note: ${note}`),
];
