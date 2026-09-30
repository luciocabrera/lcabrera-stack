/*
 * Which git the `prepare` script runs, and what it agrees with.
 *
 * An install runs `prepare` with the tree's `node_modules/.bin` ahead of
 * everything else on PATH, so a dependency shipping a `git` bin would run in
 * place of git. The script cannot import `git-exec.mjs` — it runs in trees
 * that may not have this package — so it carries the rule and `git-exec.mjs`
 * takes it from there. This suite plants a `git` where an install would put one.
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import process from 'node:process';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_HOOKS_PATH,
  gitEnvironment,
  hooksPathIn,
  resolveInstallGit,
  CONFIG_FILE_NAME as SCRIPT_CONFIG_FILE_NAME,
  TRUSTED_GIT_DIRECTORIES,
} from '../assets/workspace/scripts/hooks-path.mjs';
import { CONFIG_FILE_NAME, DEFAULT_CONFIG } from './config.mjs';
import {
  CLEAN_ENV,
  gitIn as git,
  HOOKS_SCRIPT,
  localHooksPathIn,
  scratchDirectories,
} from './hooks-path-fixtures.mjs';

const { drain, scratch } = scratchDirectories('devkit-hooks-git-');

afterEach(drain);

const plantGit = ({ directory, marker }) => {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, 'git');
  writeFileSync(path, `#!/bin/sh\ntouch '${marker}'\nexit 0\n`);
  chmodSync(path, 0o755);
};

describe('what the script reads', () => {
  test('is the config file and default the package reads', () => {
    expect(SCRIPT_CONFIG_FILE_NAME).toBe(CONFIG_FILE_NAME);
    expect(DEFAULT_HOOKS_PATH).toBe(DEFAULT_CONFIG.paths.hooks);
  });
});

const only = (paths) => (path) => paths.includes(path);

describe('resolveInstallGit', () => {
  test('takes a trusted directory over anything on PATH', () => {
    const trusted = join(TRUSTED_GIT_DIRECTORIES[0] ?? '', 'git');
    expect(
      resolveInstallGit({
        exists: only([trusted, '/opt/git/bin/git']),
        pathEntries: ['/opt/git/bin'],
      }),
    ).toBe(trusted);
  });

  test('searches PATH when no trusted directory has git', () => {
    expect(
      resolveInstallGit({
        exists: only(['/opt/git/bin/git']),
        pathEntries: ['', '/opt/git/bin'],
      }),
    ).toBe('/opt/git/bin/git');
  });

  test('never takes a git from a relative PATH entry', () => {
    expect(
      resolveInstallGit({
        exists: only([join('node_modules', '.bin', 'git'), join('bin', 'git')]),
        pathEntries: [join('node_modules', '.bin'), 'bin'],
      }),
    ).toBeUndefined();
  });

  test('never takes a git from a package directory on PATH', () => {
    expect(
      resolveInstallGit({
        exists: only(['/tree/node_modules/.bin/git']),
        pathEntries: ['/tree/node_modules/.bin'],
      }),
    ).toBeUndefined();
  });

  test('pins the child PATH and drops the repository variables', () => {
    const env = gitEnvironment({
      binary: '/opt/git/bin/git',
      env: { GIT_DIR: '/elsewhere', HOME: '/home/me', PATH: '/evil' },
    });
    expect(env.GIT_DIR).toBeUndefined();
    expect(env.HOME).toBe('/home/me');
    expect(env.PATH?.split(delimiter)).toEqual([
      '/opt/git/bin',
      ...TRUSTED_GIT_DIRECTORIES,
    ]);
  });
});

describe('hooksPathIn', () => {
  test.each([
    [undefined, '.githooks'],
    ['{}', '.githooks'],
    ['{"paths":{"hooks":""}}', '.githooks'],
    ['{"paths":{"hooks":7}}', '.githooks'],
    ['{"paths":{"hooks":"hooks"}}', 'hooks'],
  ])('%s is %s', (raw, expected) => {
    expect(hooksPathIn(raw)).toBe(expected);
  });
});

describe.skipIf(process.platform === 'win32')(
  'an install with a git planted ahead of the real one',
  () => {
    test.each([
      [
        'the tree’s node_modules/.bin',
        (root) => join(root, 'node_modules', '.bin'),
      ],
      ['a directory first on PATH', (root) => join(root, 'plant')],
    ])('does not run a git in %s', (_where, directoryOf) => {
      const root = scratch();
      git(['init', '--quiet', '.'], root);
      mkdirSync(join(root, '.githooks'));
      const marker = join(root, 'planted-git-ran');
      const directory = directoryOf(root);
      plantGit({ directory, marker });

      const { status } = spawnSync(process.execPath, [HOOKS_SCRIPT], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...CLEAN_ENV,
          PATH: [directory, CLEAN_ENV.PATH].join(delimiter),
        },
      });

      expect(status).toBe(0);
      expect(existsSync(marker)).toBe(false);
      expect(localHooksPathIn(root)).toBe('.githooks');
    });
  },
);
