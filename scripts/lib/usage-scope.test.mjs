/*
 * A worktree's `.git` is a file holding a pointer, and the report counts nothing
 * recorded in that worktree if the pointer is misread. These checks pin what the
 * pointer reader accepts, including the whitespace-only pointer that must
 * resolve to no worktree rather than to a directory named for a space.
 *
 * They also pin the direction the roster must not fail in. A missed worktree
 * loses invocations; a root resolved to an ancestor gains every repository under
 * it, and nothing in the report would say the scope was wrong.
 */
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  gitdirPointer,
  isWithinAny,
  namesADirectoryUnderAny,
  repositoryWorkingTrees,
  transcriptDirectoryFor,
} from './usage-scope.mjs';

const scratch = () => realpathSync(mkdtempSync(join(tmpdir(), 'usage-scope-')));

const treeWithGitFile = (pointer) => {
  const root = join(scratch(), 'checkout');
  mkdirSync(root);
  writeFileSync(join(root, '.git'), `gitdir: ${pointer}\n`);
  return root;
};

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

describe('repositoryWorkingTrees', () => {
  it('resolves a linked worktree back to the checkout that owns it', () => {
    const home = scratch();
    const main = join(home, 'repo');
    const worktreeGitDir = join(main, '.git', 'worktrees', 'feat');
    mkdirSync(worktreeGitDir, { recursive: true });
    const linked = join(home, 'wt-feat');
    mkdirSync(linked);
    writeFileSync(join(worktreeGitDir, 'gitdir'), `${join(linked, '.git')}\n`);
    writeFileSync(join(linked, '.git'), `gitdir: ${worktreeGitDir}\n`);

    expect(new Set(repositoryWorkingTrees(linked))).toEqual(
      new Set([main, linked]),
    );
  });

  it('does not adopt an ancestor when the git dir is kept outside the tree', () => {
    const external = join(scratch(), 'gitdirs', 'repo.git');
    mkdirSync(external, { recursive: true });
    const root = treeWithGitFile(external);

    const trees = repositoryWorkingTrees(root);

    expect(trees).toEqual([root]);
    expect(trees).not.toContain(dirname(external));
    expect(trees).not.toContain(dirname(root));
  });

  it('does not adopt the superproject of a submodule', () => {
    const superproject = scratch();
    const moduleGitDir = join(superproject, '.git', 'modules', 'child');
    mkdirSync(moduleGitDir, { recursive: true });
    const child = join(superproject, 'child');
    mkdirSync(child);
    writeFileSync(join(child, '.git'), `gitdir: ${moduleGitDir}\n`);

    const trees = repositoryWorkingTrees(child);

    expect(trees).toEqual([child]);
    expect(trees).not.toContain(superproject);
  });

  it('keeps an external git dir from putting an ancestor in the roster', () => {
    const external = join(scratch(), 'gitdirs', 'repo.git');
    mkdirSync(external, { recursive: true });
    const root = treeWithGitFile(external);
    const elsewhere = join(dirname(root), 'unrelated');

    expect(
      namesADirectoryUnderAny({
        directoryName: transcriptDirectoryFor(elsewhere),
        roots: repositoryWorkingTrees(root),
      }),
    ).toBe(false);
  });
});

describe('transcriptDirectoryFor', () => {
  it('encodes a working tree the way the transcript store names it', () => {
    expect(transcriptDirectoryFor('/home/dev/repo')).toBe('-home-dev-repo');
  });
});
