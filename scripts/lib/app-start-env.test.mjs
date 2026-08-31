import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { composeEnvFile, startEnvFiles } from './app-start-env.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const APPS_DIR = join(REPO_ROOT, 'apps');
const RUN_CONFIG = join('config', 'vite.run.config.ts');

const readRootScripts = () =>
  JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).scripts;

const appsWithRunConfig = () =>
  readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      try {
        readFileSync(join(APPS_DIR, name, RUN_CONFIG), 'utf8');
        return true;
      } catch {
        return false;
      }
    });

const startCommandOf = async (app) => {
  const module = await import(
    join(APPS_DIR, app, 'config', 'vite.run.config.ts')
  );
  return module.runConfig.tasks.start.command;
};

describe('startEnvFiles', () => {
  it('reads the guarded files in load order', () => {
    const command = String.raw`set -a; [ -f ../../x/.env ] && eval "$(tr -d "\r" < ../../x/.env)"; [ -f ./.env ] && eval "$(tr -d "\r" < ./.env)"; set +a; exec serve`;

    expect(startEnvFiles(command)).toEqual(['../../x/.env', './.env']);
  });

  it('reads none from a command that loads nothing', () => {
    expect(
      startEnvFiles('exec react-router-serve ./build/server/index.js'),
    ).toEqual([]);
  });
});

describe('composeEnvFile', () => {
  it('reads the --env-file a compose command passes', () => {
    expect(
      composeEnvFile('docker compose -f a/b.yml --env-file a/c up -d'),
    ).toBe('a/c');
  });

  it('reads nothing from a script that passes none', () => {
    expect(composeEnvFile('docker compose up -d')).toBeUndefined();
    expect(composeEnvFile(undefined)).toBeUndefined();
  });
});

describe("every app's start task loads the repo compose env file", () => {
  const composeEnvPath = composeEnvFile(readRootScripts()['db:up']);

  it('resolves the compose env file from the root db:up script', () => {
    expect(composeEnvPath).toBeDefined();
  });

  it('finds at least one app building a start task from the factory', () => {
    expect(appsWithRunConfig().length).toBeGreaterThan(0);
  });

  it.each(appsWithRunConfig())(
    '%s sources the compose env file and its own .env, in that order',
    async (app) => {
      const appDirectory = join(APPS_DIR, app);
      const loaded = startEnvFiles(await startCommandOf(app)).map((file) =>
        resolve(appDirectory, file),
      );

      expect(loaded).toEqual([
        resolve(REPO_ROOT, composeEnvPath),
        resolve(appDirectory, '.env'),
      ]);
    },
  );
});
