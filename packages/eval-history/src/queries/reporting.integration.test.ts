// @vitest-environment node

/**
 * The reporting views, the compare and flaky functions and the reader role
 * against a real Postgres holding the synthetic year of history. Timing and a
 * permission error are claims only a real server can make. It creates a
 * database of its own next to the one EVALS_TEST_DATABASE_URL names, so it
 * never races the migrator's tests over schema `evals`, and a reader role
 * under a random name; both are dropped afterwards. Unset, it skips locally
 * and fails under CI.
 */

import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { EVALS_READER_ROLE } from '../migrate/migrate.constants.ts';
import { migrateEvals } from '../migrate/migrateEvals.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { readModelPrices } from '../prices/readModelPrices.service.ts';
import { SYNTHETIC_PRIVATE_TEXT } from '../seed/seed.constants.ts';
import { seedSyntheticHistory } from '../seed/seedSyntheticHistory.service.ts';
import { columnsNamed } from './columnsNamed.util.ts';
import { flakyTasksQuery } from './flakyTasksQuery.util.ts';
import { EXCLUDED_COLUMNS, REPORTING_RELATIONS } from './queries.constants.ts';
import { readFlakyTasks } from './readFlakyTasks.service.ts';
import { readRunComparison } from './readRunComparison.service.ts';
import { readSubjectTrend } from './readSubjectTrend.service.ts';
import { readTaskPassRates } from './readTaskPassRates.service.ts';
import { runCompareQuery } from './runCompareQuery.util.ts';
import { subjectTrendQuery } from './subjectTrendQuery.util.ts';
import { taskPassRatesQuery } from './taskPassRatesQuery.util.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');
const BUDGET_MS = 500;
const SEEDED_TRIALS_AT_LEAST = 15_000;

const UUID_GROUPS = /^(.{8})(.{4})(.{4})(.{4})(.{12})$/;

const syntheticRunId = (night: number) => {
  const digest = createHash('md5')
    .update(`synthetic-run:${String(night)}`)
    .digest('hex');

  return digest.replace(UUID_GROUPS, '$1-$2-$3-$4-$5');
};

const RUN_A = syntheticRunId(299);
const RUN_B = syntheticRunId(300);

const QUERIES = {
  flakyTasks: flakyTasksQuery({ disagreeFraction: 0.2, window: 10 }),
  runCompare: runCompareQuery({ a: RUN_A, b: RUN_B }),
  subjectTrend: subjectTrendQuery({
    kind: 'skill',
    limit: 400,
    name: 'synthetic-skill-03',
  }),
  taskPassRates: taskPassRatesQuery({ runId: RUN_B }),
};

const timingSchema = z.object({
  'Execution Time': z.number(),
  'Planning Time': z.number(),
});

const planRowsSchema = z.array(
  z.object({ 'QUERY PLAN': z.tuple([timingSchema]) }),
);

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres reporting tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to report from under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('the reporting views against Postgres', () => {
  const suffix = randomUUID().replaceAll('-', '');
  const databaseName = `evals_reporting_${suffix}`;
  const smallDatabaseName = `evals_reporting_small_${suffix}`;
  const reader = { ...EVALS_READER_ROLE, name: `evals_reader_test_${suffix}` };
  const clients: pg.Client[] = [];
  const seeded = { runs: 0, trials: 0 };

  const connect = async (database?: string) => {
    const url = new URL(DATABASE_URL ?? '');

    if (database) {
      url.pathname = `/${database}`;
    }

    const client = new pg.Client({ connectionString: url.href });

    await client.connect();
    clients.push(client);

    return client;
  };

  const readerClient = async () => {
    const client = await connect(databaseName);

    await client.query(`set role "${reader.name}"`);

    return client;
  };

  beforeAll(async () => {
    const admin = await connect();

    await admin.query(`create database "${databaseName}"`);
    await admin.query(`create role "${reader.name}" nologin`);

    const client = await connect(databaseName);
    const result = await migrateEvals({
      client,
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [reader],
    });

    expect(result.granted.map(({ name }) => name)).toEqual([reader.name]);
    Object.assign(
      seeded,
      await seedSyntheticHistory({ client, endsOn: '2026-10-01' }),
    );
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.end()));
    const admin = new pg.Client({ connectionString: DATABASE_URL });

    await admin.connect();
    await admin.query(`drop database if exists "${databaseName}" with (force)`);
    await admin.query(
      `drop database if exists "${smallDatabaseName}" with (force)`,
    );
    await admin.query(`drop role if exists "${reader.name}"`);
    await admin.end();
  });

  it('holds a year of nightly runs and at least 15k trials', () => {
    expect(seeded.runs).toBe(365);
    expect(seeded.trials).toBeGreaterThanOrEqual(SEEDED_TRIALS_AT_LEAST);
  });

  it('seeds a smaller shape with the counts that follow from it', async () => {
    const admin = await connect();

    await admin.query(`create database "${smallDatabaseName}"`);
    const client = await connect(smallDatabaseName);

    await applyMigrations({ client, migrations: await readMigrations() });
    const counts = await seedSyntheticHistory({
      client,
      endsOn: '2026-10-01',
      shape: { nights: 10, subjects: 2, trialsPerTask: 1 },
    });
    const { rows } = await client.query<{ readonly subjects: number }>(
      'select count(*)::integer as subjects from evals.eval_subject',
    );

    expect(counts).toEqual({ runs: 10, trials: 10 * 2 * 2 * 1 });
    expect(rows[0]?.subjects).toBe(2);
  });

  it.each(Object.entries(QUERIES).map(([name, query]) => ({ name, query })))(
    '$name answers in under 500 ms by EXPLAIN ANALYZE',
    async ({ query }) => {
      const client = await readerClient();
      const { rows: results } = await client.query({
        text: query.text,
        values: query.values,
      });
      const { rows } = await client.query({
        text: `explain (analyze, format json) ${query.text}`,
        values: query.values,
      });
      const [timing] = planRowsSchema.parse(rows);
      const [plan] = timing?.['QUERY PLAN'] ?? [];

      expect(results.length).toBeGreaterThan(0);
      expect(
        (plan?.['Planning Time'] ?? Infinity) +
          (plan?.['Execution Time'] ?? Infinity),
      ).toBeLessThan(BUDGET_MS);
    },
  );

  it('lets the reader role read every view and function', async () => {
    const client = await readerClient();

    expect(await readTaskPassRates({ client, runId: RUN_B })).toHaveLength(14);
    expect(
      await readSubjectTrend({
        client,
        kind: 'skill',
        limit: 30,
        name: 'synthetic-skill-03',
      }),
    ).toHaveLength(30);
    expect(
      await readRunComparison({ a: RUN_A, b: RUN_B, client }),
    ).toHaveLength(14);
    expect(
      await readFlakyTasks({ client, disagreeFraction: 0, window: 10 }),
    ).not.toEqual([]);
  });

  it('denies the reader role an INSERT with a permission error', async () => {
    const client = await readerClient();

    await expect(
      client.query(
        "insert into evals.eval_subject (kind, name, path) values ('skill', 'probe', 'probe/SKILL.md')",
      ),
    ).rejects.toMatchObject({
      code: '42501',
      message: 'permission denied for table eval_subject',
    });
  });

  it('returns none of the private text the seed wrote', async () => {
    const client = await connect(databaseName);
    const { rows } = await client.query<{ readonly count: number }>({
      text: 'select count(*)::integer as count from evals.eval_trial where transcript_uri like $1',
      values: [`%${SYNTHETIC_PRIVATE_TEXT}%`],
    });
    const results = await Promise.all([
      readTaskPassRates({ client, runId: RUN_B }),
      readSubjectTrend({
        client,
        kind: 'skill',
        limit: 400,
        name: 'synthetic-skill-03',
      }),
      readRunComparison({ a: RUN_A, b: RUN_B, client }),
      readFlakyTasks({ client, disagreeFraction: 0, window: 10 }),
    ]);

    expect(rows[0]?.count).toBeGreaterThan(0);
    expect(JSON.stringify(results)).not.toContain(SYNTHETIC_PRIVATE_TEXT);
  });

  it('finds every reporting relation as a view or a function', async () => {
    const client = await connect(databaseName);
    const { rows } = await client.query<{ readonly name: string }>({
      text: "select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'evals' and c.relkind = 'v' and c.relname = any($1) union select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'evals' and p.proname = any($1)",
      values: [[...REPORTING_RELATIONS]],
    });

    expect(rows.map(({ name }) => name).toSorted(compareCodeUnits)).toEqual(
      [...REPORTING_RELATIONS].toSorted(compareCodeUnits),
    );
  });

  const readDefinitions = async () => {
    const client = await connect(databaseName);
    const { rows: viewColumns } = await client.query<{ readonly used: string }>(
      {
        text: "select table_name || '.' || column_name as used from information_schema.view_column_usage where view_schema = 'evals' and view_name = any($1)",
        values: [[...REPORTING_RELATIONS]],
      },
    );
    const { rows: functions } = await client.query<{
      readonly definition: string;
    }>({
      text: "select pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'evals' and p.proname = any($1)",
      values: [[...REPORTING_RELATIONS]],
    });

    return {
      bodies: functions.map(({ definition }) => definition),
      viewColumns: viewColumns.map(({ used }) => used),
    };
  };

  it('defines the views over no excluded column', async () => {
    const { viewColumns } = await readDefinitions();

    expect(viewColumns).toContain('eval_trial.outcome');
    expect(
      viewColumns.filter((column) =>
        (EXCLUDED_COLUMNS as readonly string[]).includes(column),
      ),
    ).toEqual([]);
  });

  it('defines the functions over no excluded column', async () => {
    const { bodies } = await readDefinitions();

    expect(bodies).not.toEqual([]);
    expect(
      bodies.flatMap((sql) => columnsNamed({ columns: EXCLUDED_COLUMNS, sql })),
    ).toEqual([]);
  });

  it('names no jsonb column in a generated query, a view or a function', async () => {
    const client = await connect(databaseName);
    const { rows } = await client.query<{ readonly qualified: string }>(
      "select table_name || '.' || column_name as qualified from information_schema.columns where table_schema = 'evals' and data_type = 'jsonb'",
    );
    const columns = rows.map(({ qualified }) => qualified);
    const { bodies, viewColumns } = await readDefinitions();
    const generated = Object.values(QUERIES).map(({ text }) => text);

    expect(columns).toContain('eval_trial_detail.detail');
    expect(
      [...generated, ...bodies].flatMap((sql) =>
        columnsNamed({ columns, sql }),
      ),
    ).toEqual([]);
    expect(viewColumns.filter((column) => columns.includes(column))).toEqual(
      [],
    );
  });
});
