// @vitest-environment node

/**
 * The migrator against a real Postgres: the advisory lock, the transaction per
 * file, the checksum check, the price upsert and the role grants are claims a
 * fake client reports green on whether or not they hold. It owns schema
 * `evals` in the database EVALS_TEST_DATABASE_URL names and drops it before
 * every test, so point it at a scratch database. Roles are cluster-wide, so the
 * grant tests create a role under a random name and drop it afterwards rather
 * than touch `evals_writer`, and the ownership test migrates as a scratch
 * migrating role the same way. Unset, it skips locally and fails under CI.
 */

import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeEach, describe, expect, it } from 'vite-plus/test';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { readFileSet } from '../hashing/readFileSet.service.ts';
import { readModelPrices } from '../prices/readModelPrices.service.ts';
import { applyMigrations } from './applyMigrations.service.ts';
import {
  EVALS_WRITER_ROLE,
  MIGRATIONS_DIRECTORY,
} from './migrate.constants.ts';
import { migrateEvals } from './migrateEvals.service.ts';
import { parseMigrationFiles } from './parseMigrationFiles.util.ts';
import { readMigrations } from './readMigrations.service.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const PLAN_TABLES = [
  'eval_annotation',
  'eval_baseline',
  'eval_run',
  'eval_subject',
  'eval_subject_version',
  'eval_task',
  'eval_task_version',
  'eval_tool_call',
  'eval_trial',
  'eval_trial_detail',
  'model_price',
  'schema_migration',
  'suite',
];

const PLAN_INDEXES = [
  'eval_run_branch_suite',
  'eval_run_git_sha',
  'eval_run_suite_started',
  'eval_trial_not_pass',
  'eval_trial_task_run',
  'eval_trial_transcript_expiry',
];

const PLAN_ENUMS = [
  'annotation_kind',
  'outcome',
  'run_status',
  'subject_kind',
  'task_kind',
  'task_set',
  'trigger',
];

const INGEST_TABLES = [
  'eval_run',
  'eval_subject',
  'eval_subject_version',
  'eval_task',
  'eval_task_version',
  'eval_tool_call',
  'eval_trial',
  'eval_trial_detail',
];

const PLAN_SUITES = [
  'rules-consistency',
  'skill-quality',
  'skills',
  'verifier-fixtures',
  'verifier-tooled',
];

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres migrator tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to migrate under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('applyMigrations against Postgres', () => {
  const clients: pg.Client[] = [];

  const connect = async () => {
    const client = new pg.Client({ connectionString: DATABASE_URL });

    await client.connect();
    clients.push(client);

    return client;
  };

  const column = async (sql: string) => {
    const client = await connect();
    const { rows } = await client.query<{ readonly value: string }>(sql);

    return rows.map(({ value }) => value);
  };

  const recorded = async () => {
    const client = await connect();
    const { rows } = await client.query(
      'select version, name, sha256, applied_at from evals.schema_migration order by version',
    );

    return rows;
  };

  beforeEach(async () => {
    const client = await connect();

    await client.query('drop schema if exists evals cascade');
  });

  const scratchRoles: string[] = [];

  const scratchRole = () => {
    const name = `evals_writer_test_${randomUUID().replaceAll('-', '')}`;

    scratchRoles.push(name);

    return { ...EVALS_WRITER_ROLE, name };
  };

  const storedPrices = async () => {
    const client = await connect();
    const { rows } = await client.query(
      `select
        model_id as "modelId",
        usd_per_mtok_cache_read::float8 as "usdPerMtokCacheRead",
        usd_per_mtok_cache_write::float8 as "usdPerMtokCacheWrite",
        usd_per_mtok_in::float8 as "usdPerMtokIn",
        usd_per_mtok_out::float8 as "usdPerMtokOut",
        to_char(valid_from at time zone 'UTC', 'YYYY-MM-DD') as "validFrom"
      from evals.model_price
      order by model_id collate "C", valid_from`,
    );

    return rows;
  };

  const migratorRoles: string[] = [];

  const scratchMigrator = async () => {
    const name = `evals_migrator_test_${randomUUID().replaceAll('-', '')}`;
    const admin = await connect();
    const { rows } = await admin.query<{ readonly name: string }>(
      'select current_database() as name',
    );

    migratorRoles.push(name);
    await admin.query(`create role "${name}" nologin`);
    await admin.query(
      `grant create on database "${rows[0]?.name ?? ''}" to "${name}"`,
    );

    return name;
  };

  const asRole = async ({
    role,
    sql,
  }: {
    readonly role: string;
    readonly sql: string;
  }) => {
    const client = await connect();

    await client.query('begin');

    try {
      await client.query(`set local role "${role}"`);

      return await client.query(sql);
    } finally {
      await client.query('rollback');
    }
  };

  afterAll(async () => {
    const client = await connect();

    await client.query('drop schema if exists evals cascade');
    await Promise.all(
      scratchRoles.map((name) => client.query(`drop role if exists "${name}"`)),
    );

    for (const name of migratorRoles) {
      await client.query(`drop owned by "${name}"`);
      await client.query(`drop role "${name}"`);
    }

    await Promise.all(clients.map((connection) => connection.end()));
  });

  it('records every file with its checksum', async () => {
    const migrations = await readMigrations();

    await applyMigrations({ client: await connect(), migrations });

    expect(await recorded()).toEqual(
      migrations.map(({ name, sha256, version }) => ({
        applied_at: expect.any(Date),
        name,
        sha256,
        version,
      })),
    );
  });

  it('creates every table, index and enum of the first migration', async () => {
    await applyMigrations({
      client: await connect(),
      migrations: await readMigrations(),
    });

    expect(
      await column(
        "select table_name as value from information_schema.tables where table_schema = 'evals' and table_type = 'BASE TABLE' order by 1",
      ),
    ).toEqual(expect.arrayContaining(PLAN_TABLES));
    expect(
      await column(
        "select indexname as value from pg_indexes where schemaname = 'evals' order by 1",
      ),
    ).toEqual(expect.arrayContaining(PLAN_INDEXES));
    expect(
      await column(
        "select t.typname as value from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'evals' and t.typtype = 'e' order by 1",
      ),
    ).toEqual(expect.arrayContaining(PLAN_ENUMS));
    expect(
      await column('select name as value from evals.suite order by 1'),
    ).toEqual(PLAN_SUITES);
  });

  it('is a no-op the second time', async () => {
    const migrations = await readMigrations();

    await applyMigrations({ client: await connect(), migrations });
    const before = await recorded();
    const second = await applyMigrations({
      client: await connect(),
      migrations,
    });

    expect(second).toEqual([]);
    expect(await recorded()).toEqual(before);
  });

  it('refuses to run after an applied file is edited, and names it', async () => {
    const files = await readFileSet({
      directory: fileURLToPath(MIGRATIONS_DIRECTORY),
    });
    const edited = files.map((file) =>
      file.path === '0001-schema.sql'
        ? {
            ...file,
            bytes: `${new TextDecoder().decode(file.bytes)}create table evals.edited (id integer);\n`,
          }
        : file,
    );
    const later = {
      bytes: 'create table evals.after_edit (id integer);\n',
      path: '9999-after-edit.sql',
    };

    await applyMigrations({
      client: await connect(),
      migrations: parseMigrationFiles(files),
    });
    const before = await recorded();

    await expect(
      applyMigrations({
        client: await connect(),
        migrations: parseMigrationFiles([...edited, later]),
      }),
    ).rejects.toThrow(/0001-schema\.sql changed since it was applied/);
    expect(await recorded()).toEqual(before);
    expect(
      await column(
        "select table_name as value from information_schema.tables where table_schema = 'evals' and table_name in ('edited', 'after_edit')",
      ),
    ).toEqual([]);
  });

  it('applies each file once when two migrators race', async () => {
    const migrations = await readMigrations();

    const first = await connect();
    const second = await connect();
    const results = await Promise.all([
      applyMigrations({ client: first, migrations }),
      applyMigrations({ client: second, migrations }),
    ]);

    expect(
      results
        .flat()
        .map(({ name }) => name)
        .toSorted(compareCodeUnits),
    ).toEqual(migrations.map(({ name }) => name));
    expect(await recorded()).toHaveLength(migrations.length);
  });

  it('rolls back a failing file and records nothing for it', async () => {
    const migrations = await readMigrations();
    const failing = {
      name: '9999-fails.sql',
      sha256: '0'.repeat(64),
      sql: 'create table evals.half_done (id integer); select 1 / 0;',
      version: 9999,
    };

    await expect(
      applyMigrations({
        client: await connect(),
        migrations: [...migrations, failing],
      }),
    ).rejects.toThrow(/division by zero/);
    const rows = await recorded();

    expect(rows.map(({ name }) => name)).toEqual(
      migrations.map(({ name }) => name),
    );
    expect(
      await column(
        "select table_name as value from information_schema.tables where table_schema = 'evals' and table_name = 'half_done'",
      ),
    ).toEqual([]);
  });

  it('seeds one price row per model and updates it in place on a changed price', async () => {
    const migrations = await readMigrations();
    const prices = await readModelPrices();

    await migrateEvals({
      client: await connect(),
      migrations,
      prices,
      roles: [],
    });

    expect(await storedPrices()).toEqual(expect.arrayContaining([...prices]));
    expect(await storedPrices()).toHaveLength(prices.length);

    const [first, ...rest] = prices;

    if (!first) {
      throw new Error('model-prices.json lists no price');
    }

    const changed = { ...first, usdPerMtokOut: first.usdPerMtokOut + 1.25 };

    await migrateEvals({
      client: await connect(),
      migrations,
      prices: [changed, ...rest],
      roles: [],
    });

    expect(await storedPrices()).toEqual(
      expect.arrayContaining([changed, ...rest]),
    );
    expect(await storedPrices()).toHaveLength(prices.length);
  });

  it('grants an existing writer role INSERT on every ingest table', async () => {
    const role = scratchRole();
    const admin = await connect();

    await admin.query(`create role "${role.name}" nologin`);
    const result = await migrateEvals({
      client: await connect(),
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [role],
    });

    expect(result.granted.map(({ name }) => name)).toEqual([role.name]);
    expect(result.missing).toEqual([]);
    expect(
      await column(
        `select c.relname as value from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'evals' and c.relkind = 'r' and has_table_privilege('${role.name}', c.oid, 'INSERT') order by 1`,
      ),
    ).toEqual(expect.arrayContaining(INGEST_TABLES));
    expect(
      await column(
        `select privilege_type as value from information_schema.role_table_grants where grantee = '${role.name}' and table_schema = 'evals' and table_name = 'eval_trial' order by 1`,
      ),
    ).toEqual(['DELETE', 'INSERT', 'SELECT', 'UPDATE']);

    await admin.query('begin');
    await admin.query(`set local role "${role.name}"`);
    const { rows } = await admin.query<{ readonly id: string }>(
      "insert into evals.eval_subject (kind, name, path) values ('skill', 'probe', 'probe/SKILL.md') returning id",
    );

    await admin.query('rollback');
    expect(rows).toHaveLength(1);
  });

  it('leaves the writer owning nothing when a separate role migrates', async () => {
    const migrator = await scratchMigrator();
    const writer = scratchRole();
    const admin = await connect();

    await admin.query(`create role "${writer.name}" nologin`);
    const client = await connect();

    await client.query(`set role "${migrator}"`);
    const result = await migrateEvals({
      client,
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [writer],
    });

    expect(result.granted.map(({ name }) => name)).toEqual([writer.name]);

    const ownersSql = `
      select nspowner::regrole::text as value from pg_namespace where nspname = 'evals'
      union all
      select c.relowner::regrole::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'evals'
      union all
      select t.typowner::regrole::text from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'evals'`;

    expect(new Set(await column(ownersSql))).toEqual(new Set([migrator]));
    expect(
      await column(
        `select c.relname as value from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'evals' and c.relkind = 'r' and has_table_privilege('${writer.name}', c.oid, 'INSERT') order by 1`,
      ),
    ).toEqual(expect.arrayContaining(INGEST_TABLES));

    const { rows } = await asRole({
      role: writer.name,
      sql: "insert into evals.eval_subject (kind, name, path) values ('skill', 'probe', 'probe/SKILL.md') returning id",
    });

    expect(rows).toHaveLength(1);
    await expect(
      asRole({
        role: writer.name,
        sql: 'alter table evals.eval_trial add column probe integer',
      }),
    ).rejects.toThrow(/must be owner of table eval_trial/);
    await expect(
      asRole({ role: writer.name, sql: 'drop table evals.eval_trial' }),
    ).rejects.toThrow(/must be owner of table eval_trial/);
    await expect(
      asRole({ role: writer.name, sql: 'alter schema evals rename to probe' }),
    ).rejects.toThrow(/must be owner of schema evals/);
    await expect(
      asRole({ role: writer.name, sql: 'drop schema evals cascade' }),
    ).rejects.toThrow(/must be owner of schema evals/);
  });

  it('reports a missing role instead of failing', async () => {
    const role = scratchRole();
    const result = await migrateEvals({
      client: await connect(),
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [role],
    });

    expect(result.granted).toEqual([]);
    expect(result.missing).toEqual([role]);
  });
});
