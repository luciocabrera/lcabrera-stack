/*
 * The count a session-start hook prints: how many linked worktrees look
 * removable from local evidence alone. A clean worktree counts when it is
 * detached on a commit the default branch contains, or when its branch's
 * upstream is gone, which is what a fetch with pruning leaves after a pull
 * request merges or closes. It reads refs and status, never the network, and
 * it changes nothing.
 */

import {
  gitSucceeds,
  isOnBase,
  parseWorktreeList,
  resolveBase,
} from './worktree-git.mjs';

const GONE = '[gone]';

const goneBranches = ({ git, root }) =>
  new Set(
    git(
      [
        'for-each-ref',
        '--format=%(refname:short)%00%(upstream:track)',
        'refs/heads',
      ],
      root,
    )
      .split('\n')
      .map((line) => line.split('\0'))
      .filter(([, track]) => track === GONE)
      .map(([name]) => name),
  );

const isClean = ({ git, path }) =>
  git(['status', '--porcelain', '--untracked-files=normal'], path) === '';

const looksRemovable = ({ base, entry, git, gone }) =>
  entry.branch === undefined
    ? base !== undefined &&
      isOnBase({ base, commit: entry.head, cwd: entry.path, git })
    : gone.has(entry.branch);

/**
 * @param {{ base?: string, git: (args: string[], cwd: string) => string,
 *   root: string }} args
 */
export const countWorktreeHint = ({ base, git, root }) => {
  if (!gitSucceeds({ args: ['rev-parse', '--git-dir'], cwd: root, git })) {
    return 0;
  }
  const resolved = resolveBase({ base, cwd: root, git });
  const gone = goneBranches({ git, root });
  return parseWorktreeList(git(['worktree', 'list', '--porcelain'], root))
    .filter(
      (entry) =>
        !entry.isMain && !entry.bare && !entry.locked && !entry.prunable,
    )
    .filter((entry) => looksRemovable({ base: resolved, entry, git, gone }))
    .filter((entry) => isClean({ git, path: entry.path })).length;
};

const hintLine = (count) =>
  `${count} ${count === 1 ? 'git worktree looks' : 'git worktrees look'} removable — run /worktree-housekeeping to review and remove them.`;

/**
 * @param {{ count: number, threshold: number }} args
 */
export const renderHint = ({ count, threshold }) =>
  count > threshold ? hintLine(count) : undefined;
