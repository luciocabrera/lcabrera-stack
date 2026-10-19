/*
 * What git can say about a repository's linked worktrees, read without changing
 * any of them: the list, each one's status, whether a commit is on the default
 * branch, and whether a changed file's content already exists in a history.
 *
 * Every reader takes the git runner as an argument, so the parsers stay pure
 * and a test can drive the readers against a scratch repository.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BRANCH_PREFIX = 'refs/heads/';

const ZERO_OBJECT = /^0+$/u;

const UNMATCHABLE_BLOB = 'unreadable';

const fieldsOf = (block) =>
  new Map(
    block.split('\n').map((line) => {
      const space = line.indexOf(' ');
      return space === -1
        ? [line, '']
        : [line.slice(0, space), line.slice(space + 1)];
    }),
  );

const branchName = (ref) =>
  ref?.startsWith(BRANCH_PREFIX) ? ref.slice(BRANCH_PREFIX.length) : undefined;

/**
 * @param {string} porcelain
 */
export const parseWorktreeList = (porcelain) =>
  porcelain
    .split(/\n\s*\n/u)
    .map((block) => block.trim())
    .filter((block) => block.startsWith('worktree '))
    .map((block, index) => {
      const fields = fieldsOf(block);
      return {
        bare: fields.has('bare'),
        branch: branchName(fields.get('branch')),
        head: fields.get('HEAD') ?? '',
        isMain: index === 0,
        locked: fields.has('locked'),
        path: fields.get('worktree') ?? '',
        prunable: fields.has('prunable'),
      };
    });

const statusRecord = (records, index) => {
  const record = records[index] ?? '';
  const code = record.slice(0, 2);
  const path = record.slice(3);
  const renamed = code.includes('R') || code.includes('C');
  return {
    change: { index: code[0] ?? ' ', path, worktree: code[1] ?? ' ' },
    origin: renamed ? records[index + 1] : undefined,
    width: renamed ? 2 : 1,
  };
};

/**
 * @param {string} output
 */
export const parseStatus = (output) => {
  const records = output.split('\0').filter((record) => record !== '');
  const changes = [];
  let untracked = 0;
  let index = 0;
  while (index < records.length) {
    const { change, origin, width } = statusRecord(records, index);
    index += width;
    if (change.index === '?') untracked += 1;
    else if (change.index !== '!') changes.push(change);
    if (origin !== undefined) {
      changes.push({ index: 'D', path: origin, worktree: ' ' });
    }
  }
  return { changes, untracked };
};

const blobsOfMeta = (meta) =>
  meta
    .split(' ')
    .slice(2, 4)
    .filter((sha) => !ZERO_OBJECT.test(sha));

/**
 * @param {string} raw
 * @returns {Map<string, Set<string>>}
 */
export const parseRawBlobs = (raw) => {
  const tokens = raw.split('\0').map((token) => token.replace(/^\n+/u, ''));
  return tokens.reduce((blobs, token, index) => {
    const path = tokens[index + 1];
    if (path === undefined || !token.startsWith(':')) return blobs;
    blobs.set(
      path,
      new Set([...(blobs.get(path) ?? []), ...blobsOfMeta(token)]),
    );
    return blobs;
  }, new Map());
};

/**
 * @typedef {(args: string[], cwd: string) => string} GitRunner
 */

/**
 * @param {{ args: string[], cwd: string, git: GitRunner }} args
 */
export const gitSucceeds = ({ args, cwd, git }) => {
  try {
    git(args, cwd);
    return true;
  } catch {
    return false;
  }
};

const firstVerified = ({ candidates, cwd, git }) =>
  candidates.find((ref) =>
    gitSucceeds({ args: ['rev-parse', '--verify', '--quiet', ref], cwd, git }),
  );

const originHead = ({ cwd, git }) => {
  try {
    return git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd);
  } catch {
    return '';
  }
};

/**
 * @param {{ base?: string, cwd: string, git: GitRunner }} args
 * @returns {string | undefined}
 */
export const resolveBase = ({ base, cwd, git }) => {
  if (base !== undefined)
    return firstVerified({ candidates: [base], cwd, git });
  const remote = originHead({ cwd, git });
  return firstVerified({
    candidates: [remote, 'main', 'master'].filter((ref) => ref !== ''),
    cwd,
    git,
  });
};

/**
 * @param {{ base: string, commit: string, cwd: string, git: GitRunner }} args
 */
export const isOnBase = ({ base, commit, cwd, git }) =>
  gitSucceeds({
    args: ['merge-base', '--is-ancestor', commit, base],
    cwd,
    git,
  });

const readOrUnmatchable = ({ args, cwd, git }) => {
  try {
    return git(args, cwd);
  } catch {
    return UNMATCHABLE_BLOB;
  }
};

const blobsOfChange = ({ change, cwd, git }) => {
  const isStaged = ![' ', 'D'].includes(change.index);
  const onDisk = existsSync(join(cwd, change.path));
  return [
    ...(onDisk
      ? [
          readOrUnmatchable({
            args: ['hash-object', '--', change.path],
            cwd,
            git,
          }),
        ]
      : []),
    ...(isStaged
      ? [
          readOrUnmatchable({
            args: ['rev-parse', `:${change.path}`],
            cwd,
            git,
          }),
        ]
      : []),
  ];
};

const historyBlobs = ({ cwd, git, paths, refs }) =>
  parseRawBlobs(
    git(
      [
        'log',
        '--format=',
        '--raw',
        '--no-abbrev',
        '--no-renames',
        '-z',
        ...refs,
        '--',
        ...paths,
      ],
      cwd,
    ),
  );

const isAbsentAt = ({ cwd, git, path, ref }) =>
  !gitSucceeds({ args: ['cat-file', '-e', `${ref}:${path}`], cwd, git });

const matches = ({ blobs, change, cwd, git, history, tip }) =>
  blobs.length === 0
    ? isAbsentAt({ cwd, git, path: change.path, ref: tip })
    : blobs.every((blob) => history.get(change.path)?.has(blob) === true);

const bucketOf = ({ base, change, cwd, git, histories, own }) => {
  const shared = {
    blobs: blobsOfChange({ change, cwd, git }),
    change,
    cwd,
    git,
  };
  if (matches({ ...shared, history: histories.base, tip: base })) return 'base';
  return matches({ ...shared, history: histories.own, tip: own[0] ?? 'HEAD' })
    ? 'branch'
    : 'neither';
};

/**
 * @param {{ base: string, changes: { index: string, path: string,
 *   worktree: string }[], cwd: string, git: GitRunner, own: string[] }} args
 * @returns {{ base: number, branch: number, neither: number }}
 */
export const countMatches = ({ base, changes, cwd, git, own }) => {
  const empty = { base: 0, branch: 0, neither: 0 };
  if (changes.length === 0) return empty;
  const paths = changes.map((change) => change.path);
  const histories = {
    base: historyBlobs({ cwd, git, paths, refs: [base] }),
    own: historyBlobs({ cwd, git, paths, refs: own }),
  };
  return changes.reduce(
    (counts, change) => {
      const bucket = bucketOf({ base, change, cwd, git, histories, own });
      counts[bucket] += 1;
      return counts;
    },
    { base: 0, branch: 0, neither: 0 },
  );
};
