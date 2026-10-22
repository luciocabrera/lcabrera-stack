/**
 * Whether a dirty worktree holds anything that exists nowhere else, for
 * `housekeeping:prune`. Each changed file's content is looked up as a blob in
 * the history of its path, once on the default branch and once on the
 * worktree's own HEAD and upstream. Ancestry cannot answer this: a
 * squash-merge leaves the branch's commits off the default branch.
 *
 * The git runner is passed in and answers `{ status, stdout }`, so the parsers
 * stay pure and a test can drive the reader against a scratch repository.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ZERO_OBJECT = /^0+$/u;

const UNMATCHABLE = 'unreadable';

const ORDINARY_FIELDS = 8;
const RENAME_FIELDS = 9;

const ABSENT_MODE = '000000';

const isModeChanged = (fields) => {
  const [head = ABSENT_MODE, index = ABSENT_MODE, tree = ABSENT_MODE] =
    fields.slice(3, 6);
  return (
    head !== ABSENT_MODE &&
    [index, tree].some((mode) => mode !== ABSENT_MODE && mode !== head)
  );
};

const changeFrom = (record, fieldCount) => {
  const fields = record.split(' ');
  const code = fields[1] ?? '..';
  return {
    index: code[0] ?? '.',
    indexBlob: fields[7] ?? '',
    isModeChanged: isModeChanged(fields),
    path: fields.slice(fieldCount).join(' '),
    unmerged: false,
    worktree: code[1] ?? '.',
  };
};

const readRecord = (records, index) => {
  const record = records[index] ?? '';
  const kind = record[0];
  if (kind === '1')
    return { changes: [changeFrom(record, ORDINARY_FIELDS)], width: 1 };
  if (kind === '2') {
    const origin = {
      index: 'D',
      indexBlob: '',
      isModeChanged: false,
      path: records[index + 1] ?? '',
      unmerged: false,
      worktree: '.',
    };
    return { changes: [changeFrom(record, RENAME_FIELDS), origin], width: 2 };
  }
  if (kind === 'u') {
    return {
      changes: [{ ...changeFrom(record, 10), unmerged: true }],
      width: 1,
    };
  }
  return { changes: [], untracked: kind === '?' ? 1 : 0, width: 1 };
};

/**
 * @param {string} output
 */
export const parseStatusV2 = (output) => {
  const records = output.split('\0').filter((record) => record !== '');
  const result = { changes: [], untracked: 0 };
  let index = 0;
  while (index < records.length) {
    const read = readRecord(records, index);
    result.changes.push(...read.changes);
    result.untracked += read.untracked ?? 0;
    index += read.width;
  }
  return result;
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

const workingBlob = ({ change, cwd, git }) => {
  if (change.worktree === 'D' || !existsSync(join(cwd, change.path))) return [];
  const { status, stdout } = git({
    args: ['hash-object', '--', change.path],
    cwd,
  });
  return [status === 0 ? stdout : UNMATCHABLE];
};

const stagedBlob = ({ index, indexBlob }) =>
  indexBlob === '' || ['.', 'D'].includes(index) || ZERO_OBJECT.test(indexBlob)
    ? []
    : [indexBlob];

const blobsOf = ({ change, cwd, git }) =>
  change.unmerged
    ? [UNMATCHABLE]
    : [...workingBlob({ change, cwd, git }), ...stagedBlob(change)];

const historyOf = ({ cwd, git, paths, refs }) => {
  const { status, stdout } = git({
    args: [
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
  });
  return status === 0 ? parseRawBlobs(stdout) : undefined;
};

const isAbsentAt = ({ cwd, git, path, ref }) =>
  git({ args: ['cat-file', '-e', `${ref}:${path}`], cwd }).status !== 0;

const isDeletionHeld = ({ change, cwd, git, history, isOwnHead, tip }) =>
  (isOwnHead || history.has(change.path)) &&
  isAbsentAt({ cwd, git, path: change.path, ref: tip });

const matches = ({ blobs, change, cwd, git, history, isOwnHead, tip }) =>
  blobs.length === 0
    ? isDeletionHeld({ change, cwd, git, history, isOwnHead, tip })
    : blobs.every((blob) => history.get(change.path)?.has(blob) === true);

const bucketOf = ({ base, change, cwd, git, histories, own }) => {
  if (change.isModeChanged === true) return 'neither';
  if (change.worktree === 'D' && stagedBlob(change).length > 0) {
    return 'neither';
  }
  const shared = { blobs: blobsOf({ change, cwd, git }), change, cwd, git };
  if (
    matches({ ...shared, history: histories.base, isOwnHead: false, tip: base })
  ) {
    return 'base';
  }
  return matches({
    ...shared,
    history: histories.own,
    isOwnHead: true,
    tip: own[0] ?? 'HEAD',
  })
    ? 'branch'
    : 'neither';
};

/**
 * @param {{ base: string, changes: object[], cwd: string,
 *   git: (args: { args: string[], cwd: string }) => { status: number | null,
 *   stdout: string }, own: string[] }} args
 * @returns {{ base: number, branch: number, neither: number,
 *   unreadable?: string }}
 */
export const countMatches = ({ base, changes, cwd, git, own }) => {
  const counts = { base: 0, branch: 0, neither: 0 };
  if (changes.length === 0) return counts;
  const paths = changes.map((change) => change.path);
  const histories = {
    base: historyOf({ cwd, git, paths, refs: [base] }),
    own: historyOf({ cwd, git, paths, refs: own }),
  };
  if (histories.base === undefined || histories.own === undefined) {
    return { ...counts, unreadable: 'git log of the changed paths' };
  }
  for (const change of changes) {
    counts[bucketOf({ base, change, cwd, git, histories, own })] += 1;
  }
  return counts;
};
