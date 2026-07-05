import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveProjectPath } from './matchProject.util.ts';

describe('resolveProjectPath', () => {
  let repoPath: string;

  beforeEach(() => {
    repoPath = realpathSync(mkdtempSync(join(tmpdir(), 'scan-ingestion-git-')));
    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repoPath });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], {
      cwd: repoPath,
    });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoPath });
    writeFileSync(join(repoPath, 'README.md'), '# test\n');
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
    expect(resolved.projectName).toBe(basename(repoPath));
  });

  it('resolves from a nested subdirectory to the same git root', () => {
    const nestedDir = join(repoPath, 'src', 'nested');
    execFileSync('mkdir', ['-p', nestedDir]);

    const resolved = resolveProjectPath({ localPath: nestedDir });

    expect(resolved.canonicalPath).toBe(repoPath);
  });

  it('falls back to the given path when it is not a git repo', () => {
    const nonGitPath = realpathSync(
      mkdtempSync(join(tmpdir(), 'scan-ingestion-nogit-')),
    );

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
