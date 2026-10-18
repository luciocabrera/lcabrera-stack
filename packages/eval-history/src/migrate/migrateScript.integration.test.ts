// @vitest-environment node

/**
 * The exit code and output of `scripts/migrate.mjs` itself against a real
 * Postgres. The script grants the fixed roles `evals_writer` and
 * `evals_reader`, so this creates either one only when the cluster lacks it,
 * drops only the ones it created, and confines every grant to a database of
 * its own next to the one EVALS_TEST_DATABASE_URL names, dropped afterwards.
 * Unset, it skips locally and fails under CI.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import { inSequence } from '../ingest/inSequence.service.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { EVALS_ROLES } from './migrate.constants.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const SCRIPT = fileURLToPath(
  new URL('../../scripts/migrate.mjs', import.meta.url),
);

type ConnectAsArgs = {
  readonly database: string;
  readonly password?: string;
  readonly user?: string;
};

const connectionUrl = ({ database, password = '', user }: ConnectAsArgs) => {
  const url = new URL(DATABASE_URL ?? '');

  url.pathname = `/${database}`;

  if (user) {
    url.username = user;
    url.password = password;
  }

  return url.href;
};

const runScript = (migrateUrl: string) =>
  spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { EVALS_MIGRATE_DATABASE_URL: migrateUrl, PATH: process.env.PATH },
  });

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the evals:migrate script tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to migrate under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('evals:migrate against Postgres', () => {
  const { close, connect, createDatabase } = scratchConnections(
    DATABASE_URL ?? '',
  );
  const roles: string[] = [];

  const createdRoles = async () => {
    const admin = await connect();
    const { rows } = await admin.query<{ readonly rolname: string }>(
      'select rolname from pg_roles where rolname = any($1::text[])',
      [EVALS_ROLES.map(({ name }) => name)],
    );
    const existing = new Set(rows.map(({ rolname }) => rolname));
    const absent = EVALS_ROLES.map(({ name }) => name).filter(
      (name) => !existing.has(name),
    );

    roles.push(...absent);
    await inSequence({
      items: absent,
      step: (name) => admin.query(`create role "${name}" nologin`),
    });
  };

  const nonOwnerUrl = async (database: string) => {
    const user = `evals_nonowner_test_${randomUUID().replaceAll('-', '')}`;
    const password = randomUUID();
    const client = await connect(database);

    roles.push(user);
    await client.query(`create role "${user}" login password '${password}'`);
    await client.query(`grant create on database "${database}" to "${user}"`);
    await client.query(`grant usage, create on schema evals to "${user}"`);
    await client.query(
      `grant select, insert, update, delete on all tables in schema evals to "${user}"`,
    );

    return connectionUrl({ database, password, user });
  };

  afterAll(() => close({ roles }));

  it('exits 0 and prints granted for each role when the owner migrates', async () => {
    await createdRoles();
    const database = await createDatabase('evals_migrate_script');
    const { status, stdout } = runScript(connectionUrl({ database }));

    expect(status).toBe(0);
    expect(stdout).toContain('evals:migrate: granted evals_writer');
    expect(stdout).toContain('evals:migrate: granted evals_reader');
  });

  it('exits 1 naming the lacking privilege when a non-owner cannot grant it', async () => {
    await createdRoles();
    const database = await createDatabase('evals_migrate_script');

    expect(runScript(connectionUrl({ database })).status).toBe(0);

    const owner = await connect(database);

    await owner.query('revoke all on schema evals from evals_reader');
    await owner.query(
      'revoke all on all tables in schema evals from evals_reader',
    );

    const { status, stdout } = runScript(await nonOwnerUrl(database));

    expect(status).toBe(1);
    expect(stdout).toContain(
      'evals:migrate: role evals_reader still lacks these privileges after the grant',
    );
    expect(stdout).toContain('  usage on schema evals');
    expect(stdout).toContain('  select on column evals.eval_run.run_id');
    expect(stdout).toContain('  select on table evals.v_task_pass_rate');
    expect(stdout).not.toContain('granted evals_reader');
  });
});
