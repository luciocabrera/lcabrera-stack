/*
 * That `seed:synthetic` migrates through EVALS_MIGRATE_DATABASE_URL and
 * inserts through EVALS_DATABASE_URL, and never migrates through the
 * writer's URL. Asserted by spawning the script with each URL on its own
 * closed port: the port in the connection error names the connection used
 * first, and the migration runs before the inserts.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vite-plus/test';

const SCRIPT = fileURLToPath(
  new URL('seed-synthetic-history.mjs', import.meta.url),
);

const MIGRATE_URL = 'postgres://migrator@127.0.0.1:1/eval_history';
const WRITER_URL = 'postgres://evals_writer@127.0.0.1:2/eval_history';

const run = (env) =>
  spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  });

describe('seed:synthetic', () => {
  test('exits 1 naming the migrating variable when only the writer URL is set', () => {
    const { status, stderr } = run({ EVALS_DATABASE_URL: WRITER_URL });

    expect(status).toBe(1);
    expect(stderr).toContain('EVALS_MIGRATE_DATABASE_URL');
    expect(stderr).not.toContain('ECONNREFUSED');
  });

  test('exits 1 naming the writer variable when only the migrating URL is set', () => {
    const { status, stderr } = run({ EVALS_MIGRATE_DATABASE_URL: MIGRATE_URL });

    expect(status).toBe(1);
    expect(stderr).toContain('EVALS_DATABASE_URL (writer)');
    expect(stderr).not.toContain('ECONNREFUSED');
  });

  test('migrates through the migrating URL before it touches the writer URL', () => {
    const { status, stderr } = run({
      EVALS_DATABASE_URL: WRITER_URL,
      EVALS_MIGRATE_DATABASE_URL: MIGRATE_URL,
    });

    expect(status).toBe(1);
    expect(stderr).toContain('ECONNREFUSED 127.0.0.1:1');
    expect(stderr).not.toContain('127.0.0.1:2');
  });
});
