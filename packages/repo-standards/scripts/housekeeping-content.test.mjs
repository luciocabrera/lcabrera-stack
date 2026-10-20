/**
 * The parsers behind the content check and the container listing, fed the
 * exact shapes git and docker print, so a change in how either is read shows
 * here before it reaches a repository.
 */
import { describe, expect, it } from 'vite-plus/test';

import { dockerBinary, parseContainers } from './housekeeping-containers.mjs';
import {
  countMatches,
  parseRawBlobs,
  parseStatusV2,
} from './housekeeping-content.mjs';

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
  it('keeps a label value whole, commas and equals signs included', () => {
    const output = [
      JSON.stringify({
        id: 'a1',
        label: '/work/a,b=c',
        name: 'pg-one',
        state: 'running',
      }),
      JSON.stringify({ id: 'b2', label: '', name: 'pg-two', state: 'exited' }),
    ].join('\n');
    expect(parseContainers(output)).toEqual([
      {
        id: 'a1',
        isLabelRead: true,
        name: 'pg-one',
        running: true,
        worktree: '/work/a,b=c',
      },
      {
        id: 'b2',
        isLabelRead: true,
        name: 'pg-two',
        running: false,
        worktree: '',
      },
    ]);
  });

  it('marks a line whose label cannot be read, so the plan keeps it', () => {
    expect(parseContainers('not json\n{"id":"c3","state":"exited"}')).toEqual([
      {
        id: '',
        isLabelRead: false,
        name: 'not json',
        running: false,
        worktree: '',
      },
      {
        id: '',
        isLabelRead: false,
        name: '{"id":"c3","state":"exited"}',
        running: false,
        worktree: '',
      },
    ]);
  });
});

describe('dockerBinary', () => {
  it('answers undefined when no fixed directory holds docker', () => {
    expect(dockerBinary(['/nonexistent-directory'])).toBeUndefined();
  });
});

const failingLog = ({ args }) =>
  args[0] === 'log' ? { status: 128, stdout: '' } : { status: 0, stdout: ONE };

describe('countMatches', () => {
  it('reports the history lookup it could not read instead of counting', () => {
    expect(
      countMatches({
        base: 'main',
        changes: [
          {
            index: '.',
            indexBlob: '',
            path: 'a.txt',
            unmerged: false,
            worktree: 'M',
          },
        ],
        cwd: '/nonexistent',
        git: failingLog,
        own: ['HEAD'],
      }),
    ).toEqual({
      base: 0,
      branch: 0,
      neither: 0,
      unreadable: 'git log of the changed paths',
    });
  });
});
