import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { closePool, getPool } from './get-pool.util.ts';

const dbEnv = {
  DB_HOST: 'localhost',
  DB_NAME: 'app',
  DB_PASSWORD: 'secret',
  DB_PORT: '5432',
  DB_USER: 'app',
};

const idleFailureMessage =
  'terminating connection due to administrator command';

const modulePath = fileURLToPath(new URL('get-pool.util.ts', import.meta.url));

const runPoolErrorInChild = (shouldDetachListeners: boolean) =>
  spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      [
        `const { getPool } = await import(${JSON.stringify(modulePath)});`,
        'const pool = getPool();',
        shouldDetachListeners ? "pool.removeAllListeners('error');" : '',
        `pool.emit('error', new Error(${JSON.stringify(idleFailureMessage)}), undefined);`,
        "console.log('still running');",
      ].join('\n'),
    ],
    { encoding: 'utf8', env: { ...process.env, ...dbEnv } },
  );

beforeEach(() => {
  for (const [key, value] of Object.entries(dbEnv)) {
    vi.stubEnv(key, value);
  }
});

afterEach(async () => {
  await closePool();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('getPool', () => {
  it('returns the same pool until it is closed', async () => {
    const first = getPool();

    expect(getPool()).toBe(first);

    await closePool();

    expect(getPool()).not.toBe(first);
  });

  it('keeps the process running when an idle connection fails and nothing else listens', () => {
    const emitWarning = vi
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => undefined);
    const pool = getPool();

    expect(() =>
      pool.emit('error', new Error(idleFailureMessage), undefined),
    ).not.toThrow();
    expect(emitWarning).toHaveBeenCalledWith(
      'An idle pooled connection failed; the pool dropped it.',
      { code: 'LCABRERA_SERVER_POOL_IDLE_ERROR', detail: idleFailureMessage },
    );
  });

  it('hands the failure to a listener the consumer attached, without a second warning', () => {
    const emitWarning = vi
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => undefined);
    const observed = vi.fn();
    const pool = getPool();
    const failure = new Error(idleFailureMessage);
    pool.on('error', observed);

    expect(() => pool.emit('error', failure, undefined)).not.toThrow();
    expect(observed).toHaveBeenCalledWith(failure, undefined);
    expect(emitWarning).not.toHaveBeenCalled();
  });

  it('lets a Node process outlive a pool error and reports it as a process warning', () => {
    const child = runPoolErrorInChild(false);

    expect(child.status).toBe(0);
    expect(child.stdout).toContain('still running');
    expect(child.stderr).toContain('[LCABRERA_SERVER_POOL_IDLE_ERROR]');
    expect(child.stderr).toContain(idleFailureMessage);
  });

  it('stops a Node process on the same pool error once no listener is attached', () => {
    const child = runPoolErrorInChild(true);

    expect(child.status).not.toBe(0);
    expect(child.stdout).not.toContain('still running');
    expect(child.stderr).toContain(idleFailureMessage);
  });
});
