import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readGitMetadata } from './readGitMetadata.util.ts';

describe('readGitMetadata', () => {
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

  it('reads the branch and commit sha for a real repo', () => {
    const metadata = readGitMetadata({ cwd: repoPath });

    expect(metadata.gitBranch).toBe('main');
    expect(metadata.gitCommitSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('returns undefineds outside a git work tree (e.g. a synced snapshot)', () => {
    const nonGitPath = makeTempDirectory('scan-ingestion-nogit-');

    try {
      const metadata = readGitMetadata({ cwd: nonGitPath });

      expect(metadata.gitBranch).toBeUndefined();
      expect(metadata.gitCommitSha).toBeUndefined();
    } finally {
      rmSync(nonGitPath, { force: true, recursive: true });
    }
  });
});
