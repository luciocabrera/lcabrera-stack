import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { buildGitChildEnv } from './buildGitChildEnv.util.ts';
import { readGitMetadata } from './readGitMetadata.util.ts';

// The fixture's own git calls must be scoped the same way readGitMetadata's
// are. Inheriting the ambient environment makes `cwd` advisory: run under a git
// hook — which always exports GIT_DIR — `git init` re-initialises the real
// repository and `git add .` stages the deletion of every file tracked there,
// because it has staged deletions as well as additions since Git 2.0. The
// fixture stops building a throwaway repo and starts rewriting the developer's.
const gitInTempRepo = ({ args, cwd }: { args: string[]; cwd: string }) =>
  execFileSync('git', args, {
    cwd,
    env: buildGitChildEnv({ env: process.env }),
  });

describe('readGitMetadata', () => {
  let repoPath: string;

  beforeEach(() => {
    repoPath = makeTempDirectory('scan-ingestion-git-');
    gitInTempRepo({ args: ['init', '--initial-branch=main'], cwd: repoPath });
    gitInTempRepo({
      args: ['config', 'user.email', 'test@example.com'],
      cwd: repoPath,
    });
    gitInTempRepo({ args: ['config', 'user.name', 'Test'], cwd: repoPath });
    writeTextFileWithin({
      baseDirectory: repoPath,
      content: '# test\n',
      targetPath: 'README.md',
    });
    gitInTempRepo({ args: ['add', '.'], cwd: repoPath });
    gitInTempRepo({ args: ['commit', '-m', 'init'], cwd: repoPath });
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
