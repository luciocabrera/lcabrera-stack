import { describe, expect, test } from 'vite-plus/test';

import {
  GIT_REPOSITORY_VARIABLES,
  TRUSTED_GIT_DIRECTORIES,
  gitEnvironment,
  gitBinary,
  readGit,
  runGit,
} from './git-exec.mjs';

describe('gitEnvironment', () => {
  test('drops every variable that would select another repository', () => {
    const env = gitEnvironment({
      GIT_DIR: '/elsewhere/.git',
      GIT_INDEX_FILE: '/elsewhere/index',
      GIT_WORK_TREE: '/elsewhere',
      HOME: '/home/dev',
    });

    for (const name of GIT_REPOSITORY_VARIABLES) {
      expect(env[name]).toBeUndefined();
    }
  });

  test('keeps the rest of the environment', () => {
    expect(gitEnvironment({ HOME: '/home/dev', LANG: 'C' })).toMatchObject({
      HOME: '/home/dev',
      LANG: 'C',
    });
  });

  test('pins PATH to the fixed directories, overriding an inherited one', () => {
    expect(gitEnvironment({ PATH: '/tmp/writable:/usr/bin' }).PATH).toBe(
      TRUSTED_GIT_DIRECTORIES.join(':'),
    );
  });
});

describe('gitBinary', () => {
  test('names the executable outright, from a fixed directory', () => {
    const binary = gitBinary();
    expect(binary).toBeDefined();
    expect(
      TRUSTED_GIT_DIRECTORIES.some((directory) =>
        binary.startsWith(`${directory}/`),
      ),
    ).toBe(true);
  });
});

describe('runGit and readGit', () => {
  test('runGit answers with trimmed stdout', () => {
    expect(runGit({ args: ['--version'], cwd: process.cwd() })).toMatch(
      /^git version /,
    );
  });

  test('runGit throws when the command fails, so a caller cannot miss it', () => {
    expect(() =>
      runGit({ args: ['rev-parse', '--verify', 'no-such-ref'], cwd: '/' }),
    ).toThrow();
  });

  test('readGit answers with the empty string instead, which is what an unset key means', () => {
    expect(
      readGit({ args: ['config', '--get', 'devkit.nothing.here'], cwd: '/' }),
    ).toBe('');
  });
});
