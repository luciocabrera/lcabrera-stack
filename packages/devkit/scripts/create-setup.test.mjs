import { describe, expect, test } from 'vite-plus/test';

import {
  composeProjectNameFor,
  databaseTarget,
  environmentFromTemplate,
  installerFor,
  readSetupFlags,
} from './create-setup.mjs';

describe('readSetupFlags', () => {
  test('runs everything when neither flag is given', () => {
    expect(readSetupFlags(['demo', '--profile', 'full'])).toEqual({
      database: true,
      install: true,
      rest: ['demo', '--profile', 'full'],
    });
  });

  test('--no-db keeps the install and drops the database', () => {
    expect(readSetupFlags(['demo', '--no-db'])).toEqual({
      database: false,
      install: true,
      rest: ['demo'],
    });
  });

  test('--no-install drops the database with it', () => {
    expect(readSetupFlags(['--no-install', 'demo'])).toEqual({
      database: false,
      install: false,
      rest: ['demo'],
    });
  });
});

const onPath =
  (...names) =>
  (name) =>
    names.includes(name);

describe('installerFor', () => {
  test('prefers vp over the package manager that launched the run', () => {
    expect(
      installerFor({
        isOnPath: onPath('vp', 'pnpm'),
        userAgent: 'pnpm/12.6.0 node/v26.10.0',
      }),
    ).toBe('vp');
  });

  test.each([
    ['pnpm/12.6.0 node/v26.10.0', 'pnpm'],
    ['npm/11.0.0 node/v26.10.0', 'npm'],
    ['yarn/4.0.0 node/v26.10.0', 'yarn'],
    ['bun/1.2.0', 'bun'],
  ])('without vp, %s installs with %s', (userAgent, installer) => {
    expect(installerFor({ isOnPath: onPath(installer), userAgent })).toBe(
      installer,
    );
  });

  test('answers nothing when the launching manager is not on PATH either', () => {
    expect(
      installerFor({ isOnPath: onPath(), userAgent: 'pnpm/12.6.0' }),
    ).toBeUndefined();
  });

  test('answers nothing when no package manager launched the run', () => {
    expect(installerFor({ isOnPath: onPath('npm') })).toBeUndefined();
  });
});

describe('environmentFromTemplate', () => {
  const template = [
    '# a comment naming COMPOSE_PROJECT_NAME',
    'COMPOSE_PROJECT_NAME=replace-me',
    'DB_USER=fixture_user',
    '',
  ].join('\n');

  test('names the compose project after the repository and keeps every other line', () => {
    expect(environmentFromTemplate({ projectName: 'my-app', template })).toBe(
      [
        '# a comment naming COMPOSE_PROJECT_NAME',
        'COMPOSE_PROJECT_NAME=my-app',
        'DB_USER=fixture_user',
        '',
      ].join('\n'),
    );
  });

  test('a package name with a dot becomes a compose project name without one', () => {
    expect(composeProjectNameFor('my.app')).toBe('my-app');
  });
});

describe('databaseTarget', () => {
  const file = 'DB_HOST=filehost\nDB_PORT=6000\nDB_USER=fileuser\n';

  test('reads the file the tasks read', () => {
    expect(databaseTarget({ file })).toEqual({
      host: 'filehost',
      port: '6000',
      user: 'fileuser',
    });
  });

  test('falls back to the compose defaults for a setting the file lacks', () => {
    expect(databaseTarget({ file: 'DB_USER=fileuser\n' })).toEqual({
      host: 'localhost',
      port: '5432',
      user: 'fileuser',
    });
  });
});
