/*
 * Which git the `prepare` script runs, and what it agrees with.
 *
 * An install runs `prepare` with the tree's `node_modules/.bin` ahead of
 * everything else on PATH, so a dependency shipping a `git` bin would run in
 * place of git. The script cannot import the resolver in `git-exec.mjs` — it
 * runs in trees that may not have this package — so it carries the same rule,
 * and this suite holds the two copies together and plants a `git` where an
 * install would put one.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_HOOKS_PATH,
  gitEnvironment,
  hooksPathIn,
  resolveGit,
  CONFIG_FILE_NAME as SCRIPT_CONFIG_FILE_NAME,
  GIT_REPOSITORY_VARIABLES as SCRIPT_REPOSITORY_VARIABLES,
  TRUSTED_GIT_DIRECTORIES as SCRIPT_TRUSTED_DIRECTORIES,
} from '../assets/workspace/scripts/hooks-path.mjs';
import { CONFIG_FILE_NAME, DEFAULT_CONFIG } from './config.mjs';
import {
  GIT_REPOSITORY_VARIABLES,
  TRUSTED_GIT_DIRECTORIES,
} from './git-exec.mjs';
import { HOOKS_PATH_SCRIPT } from './workspace.mjs';

const SCRIPT = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'assets',
  'workspace',
  HOOKS_PATH_SCRIPT,
);

const ENV = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => !GIT_REPOSITORY_VARIABLES.has(name),
  ),
);

const scratches = [];

const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-hooks-git-'));
  scratches.push(root);
  return root;
};

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) rmSync(root, { force: true, recursive: true });
});

const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: ENV,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const plantGit = ({ directory, marker }) => {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, 'git');
  writeFileSync(path, `#!/bin/sh\ntouch '${marker}'\nexit 0\n`);
  chmodSync(path, 0o755);
};

describe('the copy of the git rule the script carries', () => {
  test('trusts the directories git-exec trusts', () => {
    expect(SCRIPT_TRUSTED_DIRECTORIES).toEqual(TRUSTED_GIT_DIRECTORIES);
  });

  test('scrubs the variables git-exec scrubs', () => {
    expect([...SCRIPT_REPOSITORY_VARIABLES]).toEqual([
      ...GIT_REPOSITORY_VARIABLES,
    ]);
  });

  test('reads the config file and default the package reads', () => {
    expect(SCRIPT_CONFIG_FILE_NAME).toBe(CONFIG_FILE_NAME);
    expect(DEFAULT_HOOKS_PATH).toBe(DEFAULT_CONFIG.paths.hooks);
  });
});

const only = (paths) => (path) => paths.includes(path);

describe('resolveGit', () => {
  test('takes a trusted directory over anything on PATH', () => {
    const trusted = join(TRUSTED_GIT_DIRECTORIES[0] ?? '', 'git');
    expect(
      resolveGit({
        exists: only([trusted, '/opt/git/bin/git']),
        pathEntries: ['/opt/git/bin'],
      }),
    ).toBe(trusted);
  });

  test('searches PATH when no trusted directory has git', () => {
    expect(
      resolveGit({
        exists: only(['/opt/git/bin/git']),
        pathEntries: ['', '/opt/git/bin'],
      }),
    ).toBe('/opt/git/bin/git');
  });

  test('never takes a git from a package directory on PATH', () => {
    expect(
      resolveGit({
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

      const { status } = spawnSync(process.execPath, [SCRIPT], {
        cwd: root,
        encoding: 'utf8',
        env: { ...ENV, PATH: [directory, ENV.PATH].join(delimiter) },
      });

      expect(status).toBe(0);
      expect(existsSync(marker)).toBe(false);
      expect(git(['config', '--local', '--get', 'core.hooksPath'], root)).toBe(
        '.githooks',
      );
    });
  },
);
