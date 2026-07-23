import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import {
  createReactRouterRunConfig,
  LOAD_LOCAL_ENV,
} from './vite.run.shared.config.ts';

// The start task runs with cwd = the app directory (apps/<name>), so the env
// sources are addressed relatively — ../../docker/local/.env at the repo root
// and ./.env in the app. Each case builds that two-level layout inside a
// throwaway `mktemp -d`, `cd`s into the app dir, runs the *real* LOAD_LOCAL_ENV
// fragment, and echoes one variable. The regression this guards (a bare
// `react-router-serve` that loads no env — the #329 production failure) passes
// any string assertion but fails a behavioural one, so the check has to boot a
// shell. Fixture files are written by the shell, not node:fs, to keep the value
// of one variable the assertion sees exactly what a served loader's process.env
// would hold.

type EnvCase = {
  readonly appEnv?: string;
  readonly key: string;
  readonly rootEnv?: string;
};

const envValueAfterLoad = ({ appEnv, key, rootEnv }: EnvCase) => {
  const writeRoot =
    rootEnv === undefined ? ':' : 'printf %s "$1" > "$d/docker/local/.env"';
  const writeApp =
    appEnv === undefined ? ':' : 'printf %s "$2" > "$d/apps/app/.env"';

  const script = [
    'd=$(mktemp -d)',
    'mkdir -p "$d/docker/local" "$d/apps/app"',
    writeRoot,
    writeApp,
    `cd "$d/apps/app"; ${LOAD_LOCAL_ENV} printf %s "$${key}" > "$d/out"`,
    'cd /',
    'cat "$d/out"',
    'rm -rf "$d"',
  ].join('; ');

  return execFileSync('sh', ['-c', script, 'sh', rootEnv ?? '', appEnv ?? ''], {
    encoding: 'utf8',
  });
};

describe('LOAD_LOCAL_ENV', () => {
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
});

describe('createReactRouterRunConfig start task', () => {
  it('loads local env before serving the production build', () => {
    const { command } = createReactRouterRunConfig().tasks.start;

    expect(command.startsWith(LOAD_LOCAL_ENV)).toBe(true);
    expect(command.indexOf(LOAD_LOCAL_ENV)).toBeLessThan(
      command.indexOf('react-router-serve'),
    );
    expect(command).toContain('react-router-serve ./build/server/index.js');
  });
});
