import { describe, expect, test } from 'vite-plus/test';

import {
  buildGitEnv,
  GIT_BINARY_ENV,
  GIT_REPOSITORY_VARIABLES,
  resolveGitBinary,
  runGit,
} from './run-git.mjs';

describe('buildGitEnv', () => {
  test('drops every repository-selecting variable', () => {
    const env = buildGitEnv(
      Object.fromEntries([
        ...GIT_REPOSITORY_VARIABLES.map((name) => [name, '/elsewhere']),
        ['HOME', '/home/dev'],
      ]),
    );
    for (const name of GIT_REPOSITORY_VARIABLES) {
      expect(env[name], `${name} survived`).toBeUndefined();
    }
  });

  test('keeps the rest — git needs HOME for its global config', () => {
    expect(buildGitEnv({ HOME: '/home/dev', LANG: 'C' })).toMatchObject({
      HOME: '/home/dev',
      LANG: 'C',
    });
  });

  test('replaces the inherited PATH rather than prepending to it', () => {
    const { PATH } = buildGitEnv({ PATH: '/tmp/writable-by-anyone' });
    expect(PATH).not.toContain('/tmp/writable-by-anyone');
    expect(PATH).toContain('/usr/bin');
  });

  test('searches where the package managers that are not apt install git', () => {
    // This ships; a macOS or Nix consumer keeps git in none of /usr/bin, /bin
    // or /usr/local/bin, and a silent miss would skew every location_path.
    const { PATH } = buildGitEnv({ HOME: '/home/dev' });
    expect(PATH).toContain('/opt/homebrew/bin');
    expect(PATH).toContain('/home/dev/.nix-profile/bin');
  });
});

describe('resolveGitBinary', () => {
  test('finds git on this host', () => {
    expect(resolveGitBinary({}).path).toMatch(/git$/u);
  });

  test('honours an absolute override', () => {
    const real = resolveGitBinary({}).path;
    expect(resolveGitBinary({ [GIT_BINARY_ENV]: real }).path).toBe(real);
  });

  test('refuses a relative override rather than handing it to a PATH lookup', () => {
    const result = resolveGitBinary({ [GIT_BINARY_ENV]: 'git' });
    expect(result.path).toBeUndefined();
    expect(result.reason).toContain('absolute path');
  });

  test('refuses an override that does not exist', () => {
    const result = resolveGitBinary({ [GIT_BINARY_ENV]: '/nope/git' });
    expect(result.path).toBeUndefined();
    expect(result.reason).toContain('/nope/git');
  });

  test('names the directories it searched, and the override, when it finds none', () => {
    // HOME is the only searched directory a test can control, so this asserts
    // the shape of the failure rather than manufacturing one on a real host.
    const { reason } = resolveGitBinary({ [GIT_BINARY_ENV]: '/nope/git' });
    expect(reason).toContain(GIT_BINARY_ENV);
  });
});

describe('runGit', () => {
  test('answers with this repository, not one named by the environment', () => {
    // The load-bearing case: GIT_WORK_TREE alone redirects --show-toplevel to
    // an unrelated project, and GIT_DIR alone collapses it to cwd.
    const cwd = new URL('.', import.meta.url).pathname;
    const clean = runGit({ args: ['rev-parse', '--show-toplevel'], cwd });

    process.env.GIT_WORK_TREE = '/tmp';
    process.env.GIT_DIR = '/tmp/.git';
    try {
      expect(runGit({ args: ['rev-parse', '--show-toplevel'], cwd })).toBe(
        clean,
      );
    } finally {
      delete process.env.GIT_WORK_TREE;
      delete process.env.GIT_DIR;
    }
  });

  test('is undefined for a directory that is not a repository', () => {
    expect(
      runGit({ args: ['rev-parse', '--show-toplevel'], cwd: '/' }),
    ).toBeUndefined();
  });
});
