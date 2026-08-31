import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vite-plus/test';

import {
  createLoadLocalEnv,
  createReactRouterRunConfig,
} from './vite.run.shared.config.ts';

const REPO_ENV_FILES = ['../../docker/local/.env', './.env'];

type EnvCase = {
  readonly appEnv?: string;
  readonly key: string;
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
