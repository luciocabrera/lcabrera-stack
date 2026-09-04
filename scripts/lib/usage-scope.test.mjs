/*
 * A worktree's `.git` is a file holding a pointer, and the report counts nothing
 * recorded in that worktree if the pointer is misread. These checks pin what the
 * pointer reader accepts, including the whitespace-only pointer that must
 * resolve to no worktree rather than to a directory named for a space.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  gitdirPointer,
  isWithinAny,
  transcriptDirectoryFor,
} from './usage-scope.mjs';

describe('gitdirPointer', () => {
  it('reads the path a worktree .git file points at', () => {
    expect(gitdirPointer('gitdir: /home/dev/repo/.git/worktrees/feat\n')).toBe(
      '/home/dev/repo/.git/worktrees/feat',
    );
  });

  it('reads a pointer that is not on the first line', () => {
    expect(gitdirPointer('# note\ngitdir: /home/dev/repo/.git\n')).toBe(
      '/home/dev/repo/.git',
    );
  });

  it('is undefined when there is no pointer at all', () => {
    expect(gitdirPointer('worktree: /home/dev/repo\n')).toBeUndefined();
    expect(gitdirPointer('gitdir:   \n')).toBeUndefined();
  });

  it('is undefined for a pointer that is only whitespace', () => {
    expect(gitdirPointer(`gitdir:${' '.repeat(2000)}`)).toBeUndefined();
  });
});

describe('isWithinAny', () => {
  it('accepts a path inside a root and rejects a sibling that shares its prefix', () => {
    const roots = ['/home/dev/repo'];

    expect(isWithinAny({ path: '/home/dev/repo/packages/ui', roots })).toBe(
      true,
    );
    expect(isWithinAny({ path: '/home/dev/repo-other', roots })).toBe(false);
  });
});

describe('transcriptDirectoryFor', () => {
  it('encodes a working tree the way the transcript store names it', () => {
    expect(transcriptDirectoryFor('/home/dev/repo')).toBe('-home-dev-repo');
  });
});
