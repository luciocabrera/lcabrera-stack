import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vite-plus/test';

import {
  createLoadLocalEnv,
  createReactRouterRunConfig,
} from './vite.run.shared.config.ts';

// The start task runs with cwd = the app directory (apps/<name>), so the env
// sources are addressed relatively — ../../docker/local/.env at the repo root
// and ./.env in the app. Each case builds that two-level layout inside a
// throwaway `mktemp -d`, `cd`s into the app dir, runs the *real* fragment
// `createLoadLocalEnv` produced, and echoes one variable. The regression this
// guards (a bare `react-router-serve` that loads no env — the #329 production
// failure) passes any string assertion but fails a behavioural one, so the check
// has to boot a shell. Fixture files are written by the shell, not node:fs, to
// keep the value of one variable the assertion sees exactly what a served
// loader's process.env would hold.

/**
 * The two files this repo's React Router apps load, in precedence order.
 *
 * The package defaults to the app-local file alone, since the repo-root path is
 * this repo's dev-compose layout and no consumer's (ADR-069) — so the case that
 * matters here is the one an app passes in. Spelled out rather than imported
 * from an app config, so a change at either end shows up as a failure.
 */
const REPO_ENV_FILES = ['../../docker/local/.env', './.env'];

type EnvCase = {
  readonly appEnv?: string;
  readonly key: string;
  /** The shell fragment under test — this repo's two files unless overridden. */
  readonly loadEnv?: string;
  readonly rootEnv?: string;
};

const envValueAfterLoad = ({
  appEnv,
  key,
  loadEnv = createLoadLocalEnv(REPO_ENV_FILES),
  rootEnv,
}: EnvCase) => {
  const writeRoot =
    rootEnv === undefined ? ':' : 'printf %s "$1" > "$d/docker/local/.env"';
  const writeApp =
    appEnv === undefined ? ':' : 'printf %s "$2" > "$d/apps/app/.env"';

  const script = [
    'd=$(mktemp -d)',
    'mkdir -p "$d/docker/local" "$d/apps/app"',
    writeRoot,
    writeApp,
    `cd "$d/apps/app"; ${loadEnv} printf %s "$${key}" > "$d/out"`,
    'cd /',
    'cat "$d/out"',
    'rm -rf "$d"',
  ].join('; ');

  return execFileSync('sh', ['-c', script, 'sh', rootEnv ?? '', appEnv ?? ''], {
    encoding: 'utf8',
  });
};

describe('createLoadLocalEnv', () => {
  it('loads DB_* from the repo-root docker/local/.env', () => {
    const rootEnv = 'DB_HOST=db.example\nDB_PORT=5432\n';

    expect(envValueAfterLoad({ key: 'DB_HOST', rootEnv })).toBe('db.example');
    expect(envValueAfterLoad({ key: 'DB_PORT', rootEnv })).toBe('5432');
  });

  it('lets the app-local ./.env override the repo-root value', () => {
    const value = envValueAfterLoad({
      appEnv: 'DB_HOST=app.local\n',
      key: 'DB_HOST',
      rootEnv: 'DB_HOST=db.example\n',
    });

    expect(value).toBe('app.local');
  });

  it('strips CRs so Windows/WSL-authored .env files parse', () => {
    const host = envValueAfterLoad({
      key: 'DB_HOST',
      rootEnv: 'DB_HOST=db.example\r\nDB_PORT=5432\r\n',
    });

    expect(host).toBe('db.example');
    expect(host).not.toContain('\r');
  });

  it('tolerates missing env files instead of failing', () => {
    expect(() => envValueAfterLoad({ key: 'DB_HOST' })).not.toThrow();
    expect(envValueAfterLoad({ key: 'DB_HOST' })).toBe('');
  });

  it('reads only the app-local file by default, not a repo-root one', () => {
    const value = envValueAfterLoad({
      key: 'DB_HOST',
      loadEnv: createLoadLocalEnv(),
      rootEnv: 'DB_HOST=db.example\n',
    });

    expect(value).toBe('');
  });
});

describe('createReactRouterRunConfig start task', () => {
  it('loads the given env files before serving the production build', () => {
    const { command } = createReactRouterRunConfig({
      envFiles: REPO_ENV_FILES,
    }).tasks.start;
    const fragment = createLoadLocalEnv(REPO_ENV_FILES);

    expect(command.startsWith(fragment)).toBe(true);
    expect(command.indexOf(fragment)).toBeLessThan(
      command.indexOf('react-router-serve'),
    );
    expect(command).toContain('react-router-serve ./build/server/index.js');
  });

  it('falls back to the app-local .env when no env files are given', () => {
    const { command } = createReactRouterRunConfig().tasks.start;

    expect(command.startsWith(createLoadLocalEnv())).toBe(true);
    expect(command).not.toContain('docker/local');
  });
});
