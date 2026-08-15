import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { composeEnvFile, startEnvFiles } from './app-start-env.mjs';

// The invariant these assertions defend: every React Router app's production
// `start` task still loads the repo's compose env file.
//
// `@lcabrera/vite-config/run` used to hardcode that path, which guaranteed it
// for every caller. ADR-069 made it an `envFiles` argument — correct, since the
// path is this repo's layout and no consumer's — and in doing so turned the
// #329 production fix (a bare `react-router-serve` inherits no environment, so
// the first DB-backed request throws a ZodError) into a per-app opt-in. The
// package's own suite pins the factory, and cannot see whether an app still
// passes anything; deleting the line from an app config would otherwise fail
// nothing at all.
//
// Both ends are read from real artifacts. The expected path comes out of the
// root `db:up` script's `--env-file`, not from a constant here, so this also
// ties the file the apps load to the file the database actually starts with —
// a restated string would only prove this file agrees with itself.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const APPS_DIR = join(REPO_ROOT, 'apps');
const RUN_CONFIG = join('config', 'vite.run.config.ts');

const readRootScripts = () =>
  JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).scripts;

/** Apps that build a `start` task from the shared React Router run factory. */
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

/** The `start` command an app's own config produces, by importing it. */
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

  // Without this the comparisons below would pass vacuously the moment `db:up`
  // stopped naming an env file — the shape of silent success this whole file
  // exists to prevent.
  it('resolves the compose env file from the root db:up script', () => {
    expect(composeEnvPath).toBeDefined();
  });

  // Same reason: a glob that matches nothing runs no case and reports green.
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
