/*
 * That `evals:migrate` connects through EVALS_MIGRATE_DATABASE_URL and never
 * falls back to the writer's EVALS_DATABASE_URL. Asserted by spawning the
 * script: the writer URL below points at a closed port, so a fallback would
 * fail on the connection instead of naming the missing variable.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vite-plus/test';

const SCRIPT = fileURLToPath(new URL('migrate.mjs', import.meta.url));

const run = (env) =>
  spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  });

describe('evals:migrate', () => {
  test('exits 1 naming the missing variable when only the writer URL is set', () => {
    const { status, stderr } = run({
      EVALS_DATABASE_URL: 'postgres://evals_writer@127.0.0.1:1/eval_history',
    });

    expect(status).toBe(1);
    expect(stderr).toContain('EVALS_MIGRATE_DATABASE_URL');
    expect(stderr).not.toContain('ECONNREFUSED');
  });

  test('exits 1 naming the variable when it is not a postgres URL', () => {
    const { status, stderr } = run({
      EVALS_MIGRATE_DATABASE_URL: 'https://example.com',
    });

    expect(status).toBe(1);
    expect(stderr).toContain('EVALS_MIGRATE_DATABASE_URL');
  });

  test('connects through the migrating URL when it is set', () => {
    const { status, stderr } = run({
      EVALS_MIGRATE_DATABASE_URL:
        'postgres://migrator@127.0.0.1:1/eval_history',
    });

    expect(status).toBe(1);
    expect(stderr).toContain('ECONNREFUSED');
  });
});
