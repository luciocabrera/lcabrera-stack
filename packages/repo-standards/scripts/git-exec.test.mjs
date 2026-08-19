import { describe, expect, it } from 'vite-plus/test';

import {
  GIT_REPOSITORY_VARIABLES,
  buildGitEnv,
  runGit,
  runGitStatus,
} from './git-exec.mjs';

describe('buildGitEnv', () => {
  it('removes every repository-selecting variable', () => {
    const env = buildGitEnv({
      GIT_DIR: '/elsewhere/.git',
      GIT_INDEX_FILE: '/elsewhere/index',
      GIT_WORK_TREE: '/elsewhere',
      HOME: '/home/dev',
    });

    for (const name of GIT_REPOSITORY_VARIABLES) {
      expect(env[name]).toBeUndefined();
    }
  });

  it('keeps the rest of the environment', () => {
    // A denylist on purpose: git needs HOME for global config, which is where
    // safe.directory lives. Dropping it would trade one silent failure for
    // another.
    expect(buildGitEnv({ HOME: '/home/dev', LANG: 'C' })).toMatchObject({
      HOME: '/home/dev',
      LANG: 'C',
    });
  });

  it('pins PATH to fixed system directories, overriding any inherited one', () => {
    expect(buildGitEnv({ PATH: '/tmp/evil:/usr/bin' }).PATH).toBe(
      '/usr/local/bin:/usr/bin:/bin',
    );
  });
});

describe('runGit', () => {
  it('returns trimmed stdout for a command that succeeds', () => {
    expect(runGit({ args: ['--version'], cwd: process.cwd() })).toMatch(
      /^git version /u,
    );
  });

  it('returns undefined rather than throwing when git fails', () => {
    // Callers branch on the absent answer; a throw here would take out the
    // whole gate because one branch could not be read.
    expect(
      runGit({ args: ['rev-parse', '--verify', 'nope'], cwd: '/' }),
    ).toBeUndefined();
  });
});

describe('runGitStatus', () => {
  it('separates a command that failed from one git could not run', () => {
    const ok = runGitStatus({ args: ['--version'], cwd: process.cwd() });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toMatch(/^git version /u);
  });

  it('reports the exit code, which is the answer for commands that signal by it', () => {
    // `check-ignore` exits 1 for "nothing matched" — a real answer that
    // collapsing every failure to undefined would lose.
    const nothing = runGitStatus({
      args: ['check-ignore', 'definitely-not-ignored-xyz'],
      cwd: process.cwd(),
    });
    expect(nothing.status).toBe(1);
    expect(nothing.stdout).toBe('');
  });

  it('reports a non-zero status rather than throwing on a bad command', () => {
    const bad = runGitStatus({
      args: ['not-a-git-command'],
      cwd: process.cwd(),
    });
    expect(bad.status).not.toBe(0);
  });
});
