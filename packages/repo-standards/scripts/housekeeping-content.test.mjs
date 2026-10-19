import { describe, expect, it } from 'vite-plus/test';

import { dockerBinary, parseContainers } from './housekeeping-containers.mjs';
import { parseRawBlobs, parseStatusV2 } from './housekeeping-content.mjs';
import { THROWAWAY_LABEL } from './housekeeping-plan.mjs';

const ZERO = '0'.repeat(40);
const ONE = '1'.repeat(40);
const TWO = '2'.repeat(40);

describe('parseStatusV2', () => {
  it('reads ordinary, renamed, unmerged and untracked entries', () => {
    const output = [
      `1 .M N... 100644 100644 100644 ${ONE} ${ONE} a file.txt`,
      `2 R. N... 100644 100644 100644 ${ONE} ${TWO} R100 new.txt`,
      'old.txt',
      `u UU N... 100644 100644 100644 100644 ${ONE} ${TWO} ${ONE} both.txt`,
      '? notes/',
      '',
    ].join('\0');

    expect(parseStatusV2(output)).toEqual({
      changes: [
        {
          index: '.',
          indexBlob: ONE,
          path: 'a file.txt',
          unmerged: false,
          worktree: 'M',
        },
        {
          index: 'R',
          indexBlob: TWO,
          path: 'new.txt',
          unmerged: false,
          worktree: '.',
        },
        {
          index: 'D',
          indexBlob: '',
          path: 'old.txt',
          unmerged: false,
          worktree: '.',
        },
        {
          index: 'U',
          indexBlob: ONE,
          path: 'both.txt',
          unmerged: true,
          worktree: 'U',
        },
      ],
      untracked: 1,
    });
  });

  it('reads an empty status as clean', () => {
    expect(parseStatusV2('')).toEqual({ changes: [], untracked: 0 });
  });
});

describe('parseRawBlobs', () => {
  it('collects both sides of every change, without the null object', () => {
    const raw = [
      `:100644 100644 ${ONE} ${TWO} M`,
      'file.txt',
      `\n:000000 100644 ${ZERO} ${ONE} A`,
      'file.txt',
      '',
    ].join('\0');
    expect(parseRawBlobs(raw)).toEqual(
      new Map([['file.txt', new Set([ONE, TWO])]]),
    );
  });
});

describe('parseContainers', () => {
  it('reads each line and the worktree its label names', () => {
    const output = [
      JSON.stringify({
        ID: 'a1',
        Labels: `x=y,${THROWAWAY_LABEL}=/work/one`,
        Names: 'pg-one',
        State: 'running',
      }),
      JSON.stringify({
        ID: 'b2',
        Labels: '',
        Names: 'pg-two',
        State: 'exited',
      }),
      'not json',
    ].join('\n');
    expect(parseContainers(output)).toEqual([
      { id: 'a1', name: 'pg-one', running: true, worktree: '/work/one' },
      { id: 'b2', name: 'pg-two', running: false, worktree: '' },
    ]);
  });
});

describe('dockerBinary', () => {
  it('answers undefined when no fixed directory holds docker', () => {
    expect(dockerBinary(['/nonexistent-directory'])).toBeUndefined();
  });
});
