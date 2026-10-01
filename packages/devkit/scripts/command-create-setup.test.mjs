/*
 * The setup steps run in-process against stub executables on PATH, for the
 * branches that never reach the readiness wait: the wait is a child process,
 * and a listener in this process could not answer it while `spawnSync` holds
 * the event loop. `create-setup-run.test.mjs` covers the wait end to end.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { copyEnvironmentTemplate, runSetup } from './command-create-setup.mjs';
import { scratchDirectories } from './create-fixtures.mjs';
import { loggedSteps, writeStubs } from './create-setup-fixtures.mjs';
import { DOCKER_MISSING, DOCKER_STOPPED } from './create-setup.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const scratches = scratchDirectories('devkit-setup-');

afterEach(() => {
  vi.unstubAllEnvs();
  scratches.drain();
});

const FULL_FLAGS = { database: true, install: true };

const ENV_DIRECTORY = ['docker', 'local'];

const TEMPLATE_NAME = '.env.example';

const REAL_NAME = '.env';

const realFile = (root) => join(root, ...ENV_DIRECTORY, REAL_NAME);

const setUpWith = ({ env = {}, flags = FULL_FLAGS, stubs }) => {
  const root = scratches.make();
  const bin = join(root, 'bin');
  const log = join(root, 'setup.log');
  writeStubs({ directory: bin, names: stubs });
  vi.stubEnv('PATH', bin);
  vi.stubEnv('SETUP_LOG', log);
  vi.stubEnv('npm_config_user_agent', '');
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  const silenced = silencedConsole(vi);
  try {
    const state = runSetup({
      absolute: root,
      configuredRun: 'vp run',
      flags,
      hasDatabase: true,
      target: 'p',
    });
    return { state, steps: loggedSteps(log) };
  } finally {
    silenced.restore();
  }
};

describe('runSetup', () => {
  test('runs nothing when the install is turned off', () => {
    const { state, steps } = setUpWith({
      flags: { database: false, install: false },
      stubs: ['vp', 'docker'],
    });

    expect(steps).toEqual([]);
    expect(state).toMatchObject({ code: 0, installed: false, seeded: false });
  });

  test('installs, and names the seed when docker is not on PATH', () => {
    const { state, steps } = setUpWith({ stubs: ['vp'] });

    expect(steps).toEqual(['vp install']);
    expect(state).toMatchObject({ code: 0, installed: true, run: 'vp run' });
    expect(state.notes.join('\n')).toContain(DOCKER_MISSING);
  });

  test('installs, and names the seed when Docker is not running', () => {
    const { state, steps } = setUpWith({
      env: { DOCKER_STOPPED: '1' },
      stubs: ['vp', 'docker'],
    });

    expect(steps).toEqual(['vp install', 'docker info']);
    expect(state.notes.join('\n')).toContain(DOCKER_STOPPED);
    expect(state.code).toBe(0);
  });

  test('skips the database under --no-db', () => {
    const { state, steps } = setUpWith({
      flags: { database: false, install: true },
      stubs: ['vp', 'docker'],
    });

    expect(steps).toEqual(['vp install']);
    expect(state).toMatchObject({ code: 0, installed: true, notes: [] });
  });

  test('a failed install exits 1, runs nothing after it and says the repository is in place', () => {
    const { state, steps } = setUpWith({
      env: { FAIL_INSTALL: '1' },
      stubs: ['vp', 'docker'],
    });

    expect(steps).toEqual(['vp install']);
    expect(state).toMatchObject({ code: 1, installed: false });
    expect(state.failure).toContain('`vp install` failed');
    expect(state.failure).toContain('The repository is in place in `p`');
  });

  test('with no installer it exits 0 and names the install', () => {
    const { state, steps } = setUpWith({ stubs: [] });

    expect(steps).toEqual([]);
    expect(state.code).toBe(0);
    expect(state.notes.join('\n')).toContain('Run `vp install`');
  });
});

describe('copyEnvironmentTemplate', () => {
  const template = 'COMPOSE_PROJECT_NAME=replace-me\nDB_USER=fixture_user\n';

  const treeWithTemplate = () => {
    const root = scratches.make();
    mkdirSync(join(root, ...ENV_DIRECTORY), { recursive: true });
    writeFileSync(join(root, ...ENV_DIRECTORY, TEMPLATE_NAME), template);
    return root;
  };

  test('writes the real file from the template, named after the repository', () => {
    const root = treeWithTemplate();

    expect(
      copyEnvironmentTemplate({ absolute: root, packageName: 'my.app' }),
    ).toBe(true);
    expect(readFileSync(realFile(root), 'utf8')).toBe(
      'COMPOSE_PROJECT_NAME=my-app\nDB_USER=fixture_user\n',
    );
  });

  test('never overwrites a file that is already there', () => {
    const root = treeWithTemplate();
    writeFileSync(realFile(root), 'DB_USER=kept\n');

    expect(
      copyEnvironmentTemplate({ absolute: root, packageName: 'demo' }),
    ).toBe(false);
    expect(readFileSync(realFile(root), 'utf8')).toBe('DB_USER=kept\n');
  });

  test('does nothing in a tree without the template', () => {
    expect(
      copyEnvironmentTemplate({
        absolute: scratches.make(),
        packageName: 'demo',
      }),
    ).toBe(false);
  });
});
