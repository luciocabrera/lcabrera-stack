/*
 * What `devkit create` runs after its commit, read from a log the stub
 * executables on its PATH write to. The run is a real process with a PATH
 * holding only the stubs, so a step reached through any other executable, or
 * in any other order, shows in the log.
 */

import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import { scratchDirectories } from './create-fixtures.mjs';
import {
  createProcess,
  loggedSteps,
  stubPostgres,
  writeStubs,
} from './create-setup-fixtures.mjs';

const scratches = scratchDirectories('devkit-create-setup-');

const listeners = [];

afterEach(async () => {
  scratches.drain();
  const open = [...listeners];
  listeners.length = 0;
  await Promise.all(open.map((listener) => listener.close()));
});

const createdWith = async ({ args = [], env = {}, stubs }) => {
  const parent = scratches.make();
  const bin = join(parent, 'bin');
  const log = join(parent, 'setup.log');
  writeStubs({ directory: bin, names: stubs });
  const postgres = await stubPostgres(log);
  listeners.push(postgres);
  const result = await createProcess({
    args: ['p', ...args],
    env: {
      DB_HOST: '127.0.0.1',
      DB_PORT: String(postgres.port),
      HOME: parent,
      PATH: bin,
      SETUP_LOG: log,
      ...env,
    },
    parent,
  });
  return { ...result, steps: loggedSteps(log) };
};

const remainingSteps = (stdout) =>
  stdout
    .slice(stdout.lastIndexOf('Start with:\n') + 'Start with:\n'.length)
    .split('\n')
    .filter((line) => line.startsWith('  '))
    .map((line) => line.trim());

describe('devkit create with vp and docker on PATH', () => {
  test('installs, starts the database, waits for it and seeds it, in that order', async () => {
    const { status, stdout, steps } = await createdWith({
      stubs: ['vp', 'docker'],
    });

    expect(status).toBe(0);
    expect(steps).toEqual([
      'vp install',
      'docker info',
      'vp run db:up',
      'probe',
      'vp run db:seed',
    ]);
    expect(stdout).toContain(
      'The dependencies are installed and the database is seeded.',
    );
    expect(remainingSteps(stdout)).toEqual(['cd p', 'vp run dev']);
  });

  test('--no-db installs and leaves the database to a command it names', async () => {
    const { status, stdout, steps } = await createdWith({
      args: ['--no-db'],
      stubs: ['vp', 'docker'],
    });

    expect(status).toBe(0);
    expect(steps).toEqual(['vp install']);
    expect(remainingSteps(stdout)).toEqual([
      'cd p',
      'vp run db:seed',
      'vp run dev',
    ]);
  });

  test('--no-install runs nothing, and names the install and the database', async () => {
    const { status, stdout, steps } = await createdWith({
      args: ['--no-install'],
      stubs: ['vp', 'docker'],
    });

    expect(status).toBe(0);
    expect(steps).toEqual([]);
    expect(stdout).toContain('Nothing is installed yet.');
    expect(remainingSteps(stdout)).toEqual([
      'cd p',
      'vp install',
      'vp run db:seed',
      'vp run dev',
    ]);
  });

  test('a failing seed exits non-zero and says the repository is in place', async () => {
    const { status, stderr, stdout, steps } = await createdWith({
      env: { FAIL_SEED: '1' },
      stubs: ['vp', 'docker'],
    });

    expect(status).toBe(1);
    expect(steps.at(-1)).toBe('vp run db:seed');
    expect(stderr).toContain('`vp run db:seed` failed');
    expect(stderr).toContain('The repository is in place in `p`');
    expect(remainingSteps(stdout)).toEqual([
      'cd p',
      'vp run db:seed',
      'vp run dev',
    ]);
  });
});

describe('devkit create when a step cannot run', () => {
  test('with no docker on PATH it still installs, exits 0 and names the seed', async () => {
    const { status, stdout, steps } = await createdWith({ stubs: ['vp'] });

    expect(status).toBe(0);
    expect(steps).toEqual(['vp install']);
    expect(stdout).toContain('there is no `docker` on this PATH');
    expect(stdout).toContain('Run `vp run db:seed` once it is');
    expect(remainingSteps(stdout)).toEqual([
      'cd p',
      'vp run db:seed',
      'vp run dev',
    ]);
  });

  test('with Docker not running it exits 0 and names the seed', async () => {
    const { status, stdout, steps } = await createdWith({
      env: { DOCKER_STOPPED: '1' },
      stubs: ['vp', 'docker'],
    });

    expect(status).toBe(0);
    expect(steps).toEqual(['vp install', 'docker info']);
    expect(stdout).toContain('Docker is installed and not running');
  });

  test('with neither vp nor a package manager it exits 0 and names every step', async () => {
    const { status, stdout, steps } = await createdWith({ stubs: [] });

    expect(status).toBe(0);
    expect(steps).toEqual([]);
    expect(stdout).toContain('Run `vp install` from inside the repository');
    expect(remainingSteps(stdout)).toEqual([
      'cd p',
      'vp install',
      'vp run db:seed',
      'vp run dev',
    ]);
  });

  test('without vp it installs with the package manager that launched it', async () => {
    const { status, stdout, steps } = await createdWith({
      env: { npm_config_user_agent: 'pnpm/12.6.0 npm/? node/v26.10.0' },
      stubs: ['pnpm', 'docker'],
    });

    expect(status).toBe(0);
    expect(steps).toEqual([
      'pnpm install',
      'docker info',
      'pnpm run db:up',
      'probe',
      'pnpm run db:seed',
    ]);
    expect(remainingSteps(stdout)).toEqual(['cd p', 'pnpm run dev']);
  });
});
