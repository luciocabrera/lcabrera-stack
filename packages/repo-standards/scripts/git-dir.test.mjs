import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { resolveGitDir } from './git-dir.mjs';
import { createFixtureRoots } from './repo-fixtures.mjs';

const roots = createFixtureRoots('git-dir-');
const fixture = roots.make;

afterEach(roots.removeAll);

describe('resolveGitDir', () => {
  it('returns the directory when .git is a real directory', () => {
    const root = fixture();
    mkdirSync(join(root, '.git'));
    expect(resolveGitDir(root)).toBe(join(root, '.git'));
  });

  it('follows the pointer a linked worktree writes into a .git FILE', () => {
    const root = fixture();
    const real = join(root, 'primary', '.git', 'worktrees', 'wt');
    mkdirSync(real, { recursive: true });
    const worktree = join(root, 'wt');
    mkdirSync(worktree);
    writeFileSync(join(worktree, '.git'), `gitdir: ${real}\n`);
    expect(resolveGitDir(worktree)).toBe(real);
  });

  it('is undefined when there is no .git at all', () => {
    expect(resolveGitDir(fixture())).toBeUndefined();
  });

  it('is undefined rather than throwing when the pointer is malformed', () => {
    const root = fixture();
    writeFileSync(join(root, '.git'), 'not a gitdir line\n');
    expect(resolveGitDir(root)).toBeUndefined();
  });
});
