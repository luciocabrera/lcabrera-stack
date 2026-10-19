import { describe, expect, test } from 'vite-plus/test';

import {
  parseRawBlobs,
  parseStatus,
  parseWorktreeList,
} from './worktree-git.mjs';

describe('parseWorktreeList', () => {
  test('reads the main checkout, a branch, a detached head, a lock and a prunable entry', () => {
    const porcelain = [
      'worktree /repo\nHEAD aaa\nbranch refs/heads/main',
      'worktree /work/one\nHEAD bbb\nbranch refs/heads/feat/one\nlocked reason',
      'worktree /work/two\nHEAD ccc\ndetached\nprunable gitdir file points to non-existent location',
    ].join('\n\n');

    expect(parseWorktreeList(`${porcelain}\n`)).toEqual([
      {
        bare: false,
        branch: 'main',
        head: 'aaa',
        isMain: true,
        locked: false,
        path: '/repo',
        prunable: false,
      },
      {
        bare: false,
        branch: 'feat/one',
        head: 'bbb',
        isMain: false,
        locked: true,
        path: '/work/one',
        prunable: false,
      },
      {
        bare: false,
        branch: undefined,
        head: 'ccc',
        isMain: false,
        locked: false,
        path: '/work/two',
        prunable: true,
      },
    ]);
  });
});

describe('parseStatus', () => {
  test('counts untracked entries apart from changes, and splits a rename into both paths', () => {
    const output = [
      ' M a.txt',
      'A  b.txt',
      '?? notes/',
      'R  new.txt',
      'old.txt',
      ' D gone.txt',
      '',
    ].join('\0');

    expect(parseStatus(output)).toEqual({
      changes: [
        { index: ' ', path: 'a.txt', worktree: 'M' },
        { index: 'A', path: 'b.txt', worktree: ' ' },
        { index: 'R', path: 'new.txt', worktree: ' ' },
        { index: 'D', path: 'old.txt', worktree: ' ' },
        { index: ' ', path: 'gone.txt', worktree: 'D' },
      ],
      untracked: 1,
    });
  });

  test('reads an empty status as clean', () => {
    expect(parseStatus('')).toEqual({ changes: [], untracked: 0 });
  });
});

describe('parseRawBlobs', () => {
  test('collects both sides of every change, without the null object', () => {
    const zero = '0'.repeat(40);
    const one = '1'.repeat(40);
    const two = '2'.repeat(40);
    const raw = [
      `:100644 100644 ${one} ${two} M`,
      'file.txt',
      `\n:000000 100644 ${zero} ${one} A`,
      'file.txt',
      '',
    ].join('\0');

    expect(parseRawBlobs(raw)).toEqual(
      new Map([['file.txt', new Set([one, two])]]),
    );
  });
});
