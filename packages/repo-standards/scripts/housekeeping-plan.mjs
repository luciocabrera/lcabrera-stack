/**
 * Pure classification for `housekeeping:prune` (see ./housekeeping-prune.mjs).
 * Given git state joined with pull request state, it decides which local
 * branches, worktrees and throwaway containers are safe to delete, and which
 * are not. A branch with unique un-PR'd commits, a worktree with a change no
 * history holds or an untracked file, and any stash are reported, never
 * destroyed. A dirty worktree whose every change is already in history is
 * removed only when the caller asks for superseded ones. The cost of a wrong
 * verdict is deleted work, so it is exercised without a repository in
 * housekeeping-plan.test.mjs.
 *
 * Trunk and release lines are never pruned, whatever their pull request state
 * says.
 */

const PROTECTED = /^(?:main|release-.*)$/u;

const MERGED_OR_CLOSED = new Set(['CLOSED', 'MERGED']);

export const summarizePrs = (prs) => {
  if (!Array.isArray(prs) || prs.length === 0) {
    return;
  }
  const open = prs.find((pr) => String(pr.state).toUpperCase() === 'OPEN');
  if (open !== undefined) {
    return { number: open.number, state: 'OPEN' };
  }
  const last = prs.at(-1);
  return { number: last.number, state: String(last.state).toUpperCase() };
};

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

const contentSummary = ({ counts, untracked }) =>
  `${counts.base} match the default branch, ${counts.branch} match its own history, ${counts.neither} match neither, ${untracked} untracked`;

const isSuperseded = ({ counts, untracked }) =>
  counts !== undefined && counts.neither === 0 && untracked === 0;

const branchHoldReason = ({ branch, hasPrData, pr }) => {
  if (branch === undefined) return '';
  if (pr !== undefined && !MERGED_OR_CLOSED.has(pr.state)) {
    return `PR #${pr.number} is open`;
  }
  return pr === undefined && hasPrData === false ? 'no pull request data' : '';
};

const classifyDirty = (worktree) => {
  if (worktree.counts === undefined) {
    return {
      action: 'report',
      reason: 'uncommitted changes — resolve manually',
    };
  }
  const summary = contentSummary(worktree);
  if (!isSuperseded(worktree)) {
    return { action: 'report', reason: `uncommitted changes: ${summary}` };
  }
  const branchHold = branchHoldReason(worktree);
  if (branchHold !== '') {
    return {
      action: 'report',
      reason: `every change already in history (${summary}), but ${branchHold} — kept`,
    };
  }
  if (worktree.branch === undefined && worktree.isHeadReferenced !== true) {
    return {
      action: 'report',
      reason: `every change already in history (${summary}), but it is detached on a commit no branch, tag or remote contains — removing it would lose that commit`,
    };
  }
  return worktree.includeSuperseded
    ? { action: 'remove', force: true, reason: `superseded: ${summary}` }
    : {
        action: 'report',
        reason: `every change already in history (${summary}) — --include-superseded removes it`,
      };
};

export const classifyWorktree = (worktree) => {
  const { branch, dirty, isPrimary, locked, onBase, pr } = worktree;
  if (isPrimary) {
    return { action: 'keep', reason: 'primary checkout' };
  }
  if (locked) {
    return { action: 'keep', reason: 'locked' };
  }
  if (worktree.unreadable !== undefined) {
    return {
      action: 'report',
      reason: `kept: could not read ${worktree.unreadable}`,
    };
  }
  if (dirty) {
    return classifyDirty(worktree);
  }
  if (branch === undefined) {
    return onBase
      ? {
          action: 'remove',
          reason: 'detached on a commit the default branch contains',
        }
      : { action: 'report', reason: 'detached HEAD — resolve manually' };
  }
  if (pr !== undefined && MERGED_OR_CLOSED.has(pr.state)) {
    return {
      action: 'remove',
      reason: `branch ${branch} merged (PR #${pr.number})`,
    };
  }
  if (pr === undefined && worktree.hasPrData === false) {
    return { action: 'report', reason: 'no pull request data — kept' };
  }
  return {
    action: 'keep',
    reason: pr === undefined ? 'branch not merged' : `PR #${pr.number} open`,
  };
};

/**
 * @param {string | undefined} porcelain
 * @returns {Map<string, { head: string, locked: boolean, prunable: boolean }>}
 */
export const parseWorktreeState = (porcelain = '') =>
  new Map(
    String(porcelain)
      .split(/\n\s*\n/u)
      .map((block) => block.trim().split('\n'))
      .filter((lines) => lines[0]?.startsWith('worktree '))
      .map((lines) => [
        lines[0].slice('worktree '.length),
        {
          head: lines.find((line) => line.startsWith('HEAD '))?.slice(5) ?? '',
          locked: lines.some((line) => line.startsWith('locked')),
          prunable: lines.some((line) => line.startsWith('prunable')),
        },
      ]),
  );

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

export const THROWAWAY_LABEL = 'devkit.throwaway';

const goneReason = ({ isOnDisk, live, removing, worktree }) => {
  if (worktree === '') return '';
  if (removing.has(worktree)) {
    return `its worktree ${worktree} is removed by this plan`;
  }
  return live.has(worktree) || isOnDisk(worktree)
    ? ''
    : `orphaned: ${worktree} is gone`;
};

const keptReason = ({ isLabelRead, worktree }) => {
  if (isLabelRead === false) return 'its label could not be read';
  return worktree === ''
    ? 'running; its label names no worktree'
    : `running for ${worktree}, which is still there`;
};

/**
 * @param {{ containers: { id: string, name: string, running: boolean,
 *   worktree: string, isLabelRead?: boolean }[],
 *   isOnDisk: (path: string) => boolean, live: Set<string>,
 *   removing?: Set<string> }} args
 */
export const classifyContainers = ({
  containers,
  isOnDisk,
  live,
  removing = new Set(),
}) =>
  containers.map((container) => {
    if (container.isLabelRead === false) {
      return { ...container, action: 'keep', reason: keptReason(container) };
    }
    if (!container.running) {
      return { ...container, action: 'remove', reason: 'stopped' };
    }
    const reason = goneReason({
      isOnDisk,
      live,
      removing,
      worktree: container.worktree,
    });
    return reason === ''
      ? { ...container, action: 'keep', reason: keptReason(container) }
      : { ...container, action: 'remove', reason };
  });

export const PLAN_COMMAND =
  'gh pr list --state all --json number,headRefName,state --limit 400 | npx --no -- repo-housekeeping-prune';

const DEFAULT_ADVICE = `print the plan with: ${PLAN_COMMAND}`;

const hintLine = ({ advice, count }) =>
  `${count} ${count === 1 ? 'git worktree looks' : 'git worktrees look'} removable — ${advice}`;

/**
 * @param {{ advice?: string, count: number, threshold: number }} args
 */
export const renderHint = ({ advice = DEFAULT_ADVICE, count, threshold }) =>
  count > threshold ? hintLine({ advice, count }) : undefined;

const isHeldOnlyByDeleted = ({ deleted, entry }) =>
  entry.branch === undefined &&
  entry.force === true &&
  Array.isArray(entry.headRefs) &&
  entry.headRefs.every((ref) => deleted.has(ref));

const keepHeldOnlyByDeletedBranches = ({ deleted, entry }) =>
  isHeldOnlyByDeleted({ deleted, entry })
    ? {
        ...entry,
        action: 'report',
        force: false,
        reason:
          'every change already in history, but only branches this run deletes contain its commit — kept so that commit is not lost',
      }
    : entry;

const isCleanRemoval = (entry) =>
  entry.action === 'remove' && entry.force !== true;

const freedBranches = (verdicts) =>
  new Set(
    [
      ...Map.groupBy(
        verdicts.filter((entry) => entry.branch !== undefined),
        (entry) => entry.branch,
      ),
    ]
      .filter(([, holders]) => holders.every((entry) => isCleanRemoval(entry)))
      .map(([branch]) => branch),
  );

export const buildPlan = ({
  branches,
  checkedOutBranches,
  containers = [],
  currentBranch,
  hasPrData,
  includeSuperseded = false,
  isOnDisk = () => true,
  keep,
  prByHead,
  stashes,
  uniqueByBranch,
  worktrees,
}) => {
  const worktreeVerdicts = worktrees.map((worktree) => ({
    ...worktree,
    ...classifyWorktree({
      ...worktree,
      hasPrData,
      includeSuperseded,
      pr:
        worktree.branch === undefined
          ? undefined
          : prByHead.get(worktree.branch),
    }),
  }));
  const freed = freedBranches(worktreeVerdicts);
  const branchVerdicts = branches.map((name) => ({
    name,
    ...classifyBranch({
      isCheckedOut: checkedOutBranches.has(name) && !freed.has(name),
      isCurrent: name === currentBranch,
      keep,
      name,
      pr: prByHead.get(name),
      uniqueCount: uniqueByBranch.get(name),
    }),
  }));
  const deleted = new Set(
    branchVerdicts
      .filter((entry) => entry.action === 'delete')
      .map((entry) => `refs/heads/${entry.name}`),
  );
  const finalWorktrees = worktreeVerdicts.map((entry) =>
    keepHeldOnlyByDeletedBranches({ deleted, entry }),
  );
  const removing = new Set(
    finalWorktrees
      .filter((entry) => entry.action === 'remove')
      .map((entry) => entry.path),
  );
  const containerVerdicts = classifyContainers({
    containers,
    isOnDisk,
    live: new Set(
      worktrees
        .map((worktree) => worktree.path)
        .filter((path) => !removing.has(path)),
    ),
    removing,
  });
  return {
    deleteBranches: branchVerdicts.filter((entry) => entry.action === 'delete'),
    keepContainers: containerVerdicts.filter(
      (entry) => entry.action === 'keep',
    ),
    removeContainers: containerVerdicts.filter(
      (entry) => entry.action === 'remove',
    ),
    removeWorktrees: finalWorktrees.filter(
      (entry) => entry.action === 'remove',
    ),
    reportBranches: branchVerdicts.filter((entry) => entry.action === 'report'),
    reportWorktrees: finalWorktrees.filter(
      (entry) => entry.action === 'report',
    ),
    stashes,
  };
};
