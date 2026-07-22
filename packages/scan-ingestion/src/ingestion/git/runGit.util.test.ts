import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import { runGit } from './runGit.util.ts';

/**
 * Creates a real repository somewhere far from the working directory under
 * test, so "git ignored my cwd" stays distinguishable from "git failed
 * anyway". Removed when the calling test finishes.
 *
 * Building one is the whole point. The first version of the GIT_DIR test
 * pointed at `${process.cwd()}/.git`, which under vitest is the *workspace*
 * directory — a path with no `.git` in it. Git then failed because the
 * variable named nothing, the assertion passed, and the test proved nothing:
 * the same defect as the original test it was written to replace.
 */
const createAmbientRepo = () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), 'rungit-ambient-'));
  execFileSync('git', ['init', '--quiet', repoPath], { stdio: 'ignore' });
  onTestFinished(() => rmSync(repoPath, { force: true, recursive: true }));

  return repoPath;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('runGit', () => {
  it('returns trimmed stdout for a successful subcommand', () => {
    const version = runGit({ cwd: '/', gitArgs: ['--version'] });

    expect(version).toMatch(/^git version /);
  });

  it('returns undefined when git fails', () => {
    const result = runGit({ cwd: '/', gitArgs: ['rev-parse', 'HEAD'] });

    expect(result).toBeUndefined();
  });

  it('ignores an ambient GIT_DIR, so cwd still selects the repository', () => {
    // The regression (#258). Git reads GIT_DIR in preference to the working
    // directory, so inheriting it made this call answer for the *ambient*
    // repository from a cwd that is not a repository at all — a confident
    // answer about the wrong repo rather than a failure.
    //
    // Git exports GIT_DIR to every hook, which is how it surfaced: the same
    // assertion passed from a shell and failed from a git hook.
    //
    // `--absolute-git-dir` rather than `rev-parse HEAD` so the temp repo needs
    // no commit; a leaking GIT_DIR makes it print the temp repo's path.
    vi.stubEnv('GIT_DIR', path.join(createAmbientRepo(), '.git'));

    const result = runGit({
      cwd: '/',
      gitArgs: ['rev-parse', '--absolute-git-dir'],
    });

    expect(result).toBeUndefined();
  });

  it('ignores an ambient GIT_WORK_TREE alongside GIT_DIR', () => {
    const ambientRepo = createAmbientRepo();
    vi.stubEnv('GIT_DIR', path.join(ambientRepo, '.git'));
    vi.stubEnv('GIT_WORK_TREE', ambientRepo);

    const result = runGit({
      cwd: '/',
      gitArgs: ['rev-parse', '--absolute-git-dir'],
    });

    expect(result).toBeUndefined();
  });

  it('proves the ambient repository is real, so the tests above can fail', () => {
    // Guards the guard. If `git init` ever stopped working here, the two tests
    // above would pass no matter what runGit does — which is precisely the
    // failure mode this whole issue is about.
    vi.stubEnv('GIT_DIR', path.join(createAmbientRepo(), '.git'));

    const leaked = execFileSync('git', ['rev-parse', '--absolute-git-dir'], {
      cwd: '/',
      encoding: 'utf8',
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    expect(leaked).toContain('rungit-ambient-');
  });
});
