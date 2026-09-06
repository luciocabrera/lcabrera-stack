import { describe, expect, test } from 'vite-plus/test';

import {
  GIT_REPOSITORY_VARIABLES,
  TRUSTED_GIT_DIRECTORIES,
  gitBinary,
  gitEnvironment,
  readGit,
  resolveGit,
  runGit,
} from './git-exec.mjs';

describe('gitEnvironment', () => {
  test('drops every variable that would select another repository', () => {
    const env = gitEnvironment({
      binary: '/usr/bin/git',
      env: {
        GIT_DIR: '/elsewhere/.git',
        GIT_INDEX_FILE: '/elsewhere/index',
        GIT_WORK_TREE: '/elsewhere',
        HOME: '/home/dev',
      },
    });

    for (const name of GIT_REPOSITORY_VARIABLES) {
      expect(env[name]).toBeUndefined();
    }
  });

  test('keeps the rest of the environment', () => {
    expect(
      gitEnvironment({
        binary: '/usr/bin/git',
        env: { HOME: '/home/dev', LANG: 'C' },
      }),
    ).toMatchObject({ HOME: '/home/dev', LANG: 'C' });
  });

  test('pins PATH, dropping the inherited entries git did not come from', () => {
    const { PATH } = gitEnvironment({
      binary: '/usr/bin/git',
      env: { PATH: '/tmp/writable:/usr/bin' },
    });
    expect(PATH).not.toContain('/tmp/writable');
    for (const directory of TRUSTED_GIT_DIRECTORIES) {
      expect(PATH).toContain(directory);
    }
  });

  test('keeps the directory git itself came from, so its helpers resolve', () => {
    const { PATH } = gitEnvironment({
      binary: '/home/dev/.nix-profile/bin/git',
      env: { PATH: '/tmp/writable' },
    });
    expect(PATH.split(':')[0]).toBe('/home/dev/.nix-profile/bin');
    expect(PATH).not.toContain('/tmp/writable');
  });

  test('writes PATH under the spelling the environment already uses', () => {
    const windowsish = gitEnvironment({
      binary: '/usr/bin/git',
      env: { Path: '/tmp/writable' },
    });
    expect(
      Object.keys(windowsish).filter((name) => name.toUpperCase() === 'PATH'),
    ).toEqual(['Path']);
    expect(windowsish.Path).not.toContain('/tmp/writable');
  });

  test('names each directory once, however git was found', () => {
    const { PATH } = gitEnvironment({ binary: '/usr/bin/git', env: {} });
    const entries = PATH.split(':');
    expect(new Set(entries).size).toBe(entries.length);
  });
});

describe('finding git', () => {
  test('names the executable outright, never by bare name', () => {
    const binary = gitBinary();
    expect(binary).toBeDefined();
    expect(binary.startsWith('/') || /^[A-Za-z]:\\/.test(binary)).toBe(true);
    expect(binary.endsWith('git') || binary.endsWith('git.exe')).toBe(true);
  });

  test('prefers a fixed install location over the rest of PATH', () => {
    expect(
      resolveGit({
        directories: TRUSTED_GIT_DIRECTORIES,
        pathEntries: ['/tmp/writable'],
      }),
    ).toBe(gitBinary());
  });

  test('falls back to PATH, so a machine whose git is elsewhere is not refused', () => {
    expect(
      resolveGit({
        directories: ['/nowhere/at/all'],
        pathEntries: ['/tmp/writable', ...TRUSTED_GIT_DIRECTORIES],
      }),
    ).toBe(gitBinary());
  });

  test('answers undefined only when git is in neither, which is what the refusal reports', () => {
    expect(
      resolveGit({ directories: ['/nowhere'], pathEntries: ['/nowhere/else'] }),
    ).toBeUndefined();
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
