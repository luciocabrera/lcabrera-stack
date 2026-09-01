import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { readTextWithin } from './safe-read.mjs';

let workspace;

const makeWorkspace = () => {
  workspace = mkdtempSync(join(tmpdir(), 'safe-read-'));
  return workspace;
};

afterEach(() => {
  if (workspace !== undefined) {
    rmSync(workspace, { force: true, recursive: true });
    workspace = undefined;
  }
});

describe('readTextWithin', () => {
  it('reads a file inside the root', () => {
    const root = makeWorkspace();
    writeFileSync(join(root, 'message.txt'), 'feat(ui): add a column\n');

    expect(readTextWithin(join(root, 'message.txt'), root)).toContain(
      'feat(ui)',
    );
  });

  it('refuses a traversal that escapes every root', () => {
    const root = makeWorkspace();

    expect(() =>
      readTextWithin(join(root, '..', '..', 'etc', 'passwd'), root),
    ).toThrow(/outside the repository/u);
  });

  it('admits an extra root, which is how a linked worktree is read', () => {
    const base = makeWorkspace();
    const root = join(base, 'tree');
    const gitDir = join(base, 'git');
    mkdirSync(root);
    mkdirSync(gitDir);
    writeFileSync(join(gitDir, 'COMMIT_EDITMSG'), 'fix(api): x\n');

    expect(
      readTextWithin(join(gitDir, 'COMMIT_EDITMSG'), root, [gitDir]),
    ).toContain('fix(api)');
  });

  it('does not admit the git directory unless it is opted into', () => {
    const base = makeWorkspace();
    const root = join(base, 'tree');
    const gitDir = join(base, 'git');
    mkdirSync(root);
    mkdirSync(gitDir);
    writeFileSync(join(gitDir, 'COMMIT_EDITMSG'), 'fix(api): x\n');

    expect(() =>
      readTextWithin(join(gitDir, 'COMMIT_EDITMSG'), root, []),
    ).toThrow(/outside the repository/u);
  });

  it('ignores empty or non-string roots rather than treating them as a match', () => {
    const root = makeWorkspace();
    writeFileSync(join(root, 'a.txt'), 'x');

    expect(() => readTextWithin(join(root, 'a.txt'), '', [undefined])).toThrow(
      /outside the repository/u,
    );
  });

  it('refuses a sibling directory that merely shares the root prefix', () => {
    const base = makeWorkspace();
    const root = join(base, 'foo');
    const sibling = `${root}-evil`;
    mkdirSync(root);
    mkdirSync(sibling);
    writeFileSync(join(sibling, 'a.txt'), 'x');

    expect(() => readTextWithin(join(sibling, 'a.txt'), root)).toThrow(
      /outside the repository/u,
    );
  });

  it('accepts the root itself', () => {
    const base = makeWorkspace();
    const file = join(base, 'a.txt');
    writeFileSync(file, 'x');

    expect(readTextWithin(file, resolve(file))).toBe('x');
  });
});
