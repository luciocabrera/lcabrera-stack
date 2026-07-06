import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveProjectPath } from './matchProject.util.ts';

describe('resolveProjectPath', () => {
  let repoPath: string;

  beforeEach(() => {
    repoPath = makeTempDirectory('scan-ingestion-git-');
    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repoPath });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], {
      cwd: repoPath,
    });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoPath });
    writeTextFileWithin({
      baseDirectory: repoPath,
      content: '# test\n',
      targetPath: 'README.md',
    });
    execFileSync('git', ['add', '.'], { cwd: repoPath });
    execFileSync('git', ['commit', '-m', 'init'], { cwd: repoPath });
  });

  afterEach(() => {
    rmSync(repoPath, { force: true, recursive: true });
  });

  it('resolves the git root, branch, and commit sha for a real repo', () => {
    const resolved = resolveProjectPath({ localPath: repoPath });

    expect(resolved.canonicalPath).toBe(repoPath);
    expect(resolved.gitBranch).toBe('main');
    expect(resolved.gitCommitSha).toMatch(/^[0-9a-f]{40}$/);
    expect(resolved.projectName).toBe(path.basename(repoPath));
  });

  it('resolves from a nested subdirectory to the same git root', () => {
    const nestedDir = makeDirectoryWithin({
      baseDirectory: repoPath,
      targetPath: path.join('src', 'nested'),
    });

    const resolved = resolveProjectPath({ localPath: nestedDir });

    expect(resolved.canonicalPath).toBe(repoPath);
  });

  it('falls back to the given path when it is not a git repo', () => {
    const nonGitPath = makeTempDirectory('scan-ingestion-nogit-');

    try {
      const resolved = resolveProjectPath({ localPath: nonGitPath });

      expect(resolved.canonicalPath).toBe(nonGitPath);
      expect(resolved.gitBranch).toBeUndefined();
      expect(resolved.gitCommitSha).toBeUndefined();
    } finally {
      rmSync(nonGitPath, { force: true, recursive: true });
    }
  });
});
