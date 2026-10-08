// @vitest-environment node

/**
 * What a public /evals route may return, checked against a real Postgres. The
 * test migrates a scratch database next to the one EVALS_TEST_DATABASE_URL
 * names, seeds a short synthetic history, then writes a unique marker into
 * every column and every envelope field the allow-list does not make public.
 * Each /evals loader in the route config then answers as the read-only role,
 * and no answer may carry the marker. Unset, it skips locally and fails under
 * CI.
 */

import type pg from 'pg';
import type { LoaderFunctionArgs } from 'react-router';

import { EVALS_READER_ROLE } from '@repo/eval-history/migrate/migrate.constants';
import { migrateEvals } from '@repo/eval-history/migrate/migrateEvals.service';
import { readMigrations } from '@repo/eval-history/migrate/readMigrations.service';
import { readModelPrices } from '@repo/eval-history/prices/readModelPrices.service';
import { databaseUrl } from '@repo/eval-history/queries/databaseUrl.util';
import { closeEvalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { freeStringPaths } from '@repo/eval-history/queries/freeStringPaths.util';
import { isTextTyped } from '@repo/eval-history/queries/isTextTyped.util';
import { markedSamples } from '@repo/eval-history/queries/markedSamples.util';
import {
  ALLOWED_WHOLE_JSONB,
  EXCLUDED_COLUMNS,
  EXCLUDED_TABLES,
  JSONB_COLUMN_SCHEMAS,
  PUBLIC_FIELD_PATHS,
} from '@repo/eval-history/queries/queries.constants';
import {
  readPublicColumns,
  readSchemaColumns,
} from '@repo/eval-history/queries/readPublicColumns.service';
import { scratchServer } from '@repo/eval-history/queries/scratchServer.service';
import { seedSyntheticHistory } from '@repo/eval-history/seed/seedSyntheticHistory.service';
import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import routes from '@/routes';

import { evalsRouteEntries } from '../utils/evalsRouteEntries.util';
import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';

type JsonbColumn = keyof typeof JSONB_COLUMN_SCHEMAS;

type RouteModule = {
  readonly loader: (args: LoaderFunctionArgs) => Promise<unknown>;
};

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const ENTRIES = evalsRouteEntries({ routes });
const MODULES = import.meta.glob<RouteModule>('../**/{root,layout}.ts');

const MARKER = `zzprivate${randomBytes(8).toString('hex')}`;

const SHAPE = { nights: 4, subjects: 2, trialsPerTask: 3 };

const seededRowsSchema = z.array(
  z.object({ runId: z.string(), taskKey: z.string(), trialId: z.string() }),
);

const countSchema = z.array(z.object({ count: z.number().int() }));

const fieldSeedPaths = (column: JsonbColumn) =>
  (ALLOWED_WHOLE_JSONB as readonly string[]).includes(column)
    ? []
    : freeStringPaths({ schema: JSONB_COLUMN_SCHEMAS[column] }).filter(
        (path) =>
          !(PUBLIC_FIELD_PATHS as readonly string[]).includes(
            `${column}.${path}`,
          ),
      );

const samplesFor = (column: JsonbColumn) =>
  markedSamples({
    marker: MARKER,
    schema: JSONB_COLUMN_SCHEMAS[column],
    seedPaths: fieldSeedPaths(column),
  });

const settle = async (value: unknown): Promise<unknown> => {
  if (value instanceof Response) {
    return { body: await value.text(), status: value.status };
  }

  if (value instanceof Promise) {
    return settle(await value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Set || value instanceof Map || Array.isArray(value)) {
    return Promise.all([...value].map((entry) => settle(entry)));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value).map(async ([key, entry]) => [
          key,
          await settle(entry),
        ]),
      ),
    );
  }

  return value;
};

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the /evals public-payload tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to check the /evals payload against', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('the public /evals payload', () => {
  const suffix = randomUUID().replaceAll('-', '');
  const databaseName = `evals_dashboard_${suffix}`;
  const password = randomBytes(16).toString('hex');
  const reader = { ...EVALS_READER_ROLE, name: `evals_reader_dash_${suffix}` };
  const { connect, dispose } = scratchServer({ url: DATABASE_URL ?? '' });
  const loaded = new Map<string, RouteModule>();
  const seeded = { runId: '', taskKey: '', trialId: '' };
  const seededColumns: string[] = [];

  const seedTextColumns = async (client: pg.Client) => {
    const publicColumns = await readPublicColumns({ client });
    const schemaColumns = await readSchemaColumns({ client });
    const columns = schemaColumns.filter(
      (column) =>
        isTextTyped(column) &&
        !publicColumns.has(`${column.table}.${column.column}`),
    );

    for (const { column, dataType, table } of columns) {
      const value =
        dataType === 'ARRAY' ? `array[$1 || ctid::text]` : `$1 || ctid::text`;
      const { rowCount } = await client.query({
        text: `update evals."${table}" set "${column}" = ${value}`,
        values: [MARKER],
      });

      expect(
        rowCount,
        `evals.${table} has no row to carry the marker in ${column}`,
      ).toBeGreaterThan(0);
      seededColumns.push(`${table}.${column}`);
    }
  };

  const seedJsonb = async (client: pg.Client) => {
    const [settings] = samplesFor('eval_run.settings');
    const [env] = samplesFor('eval_run.env');
    const [totals] = samplesFor('eval_run.totals');

    await client.query({
      text: 'update evals.eval_run set settings = $1, env = $2, totals = $3',
      values: [settings, env, totals],
    });

    const details = samplesFor('eval_trial_detail.detail');
    const { rows } = await client.query({
      text: `select id::text as "trialId" from evals.eval_trial
where run_id = $1 order by id limit $2`,
      values: [seeded.runId, details.length],
    });
    const trialIds = rows.map(
      (row: { readonly trialId: string }) => row.trialId,
    );

    expect(trialIds).toHaveLength(details.length);

    for (const [index, detail] of details.entries()) {
      await client.query({
        text: `insert into evals.eval_trial_detail (trial_id, detail_schema, detail)
values ($1, $2, $3)`,
        values: [
          trialIds[index],
          z.object({ schema: z.string() }).parse(detail).schema,
          detail,
        ],
      });
    }

    seeded.trialId = trialIds[0] ?? '';
  };

  const seedOtherTables = async (client: pg.Client) => {
    await client.query({
      text: `insert into evals.eval_tool_call (trial_id, seq, tool, input_summary, at)
select id, 0, 'Read', 'placeholder', now() from evals.eval_trial where run_id = $1`,
      values: [seeded.runId],
    });
    await client.query({
      text: `insert into evals.eval_annotation (at, kind, text, author)
values (now(), 'note', 'placeholder', 'placeholder')`,
      values: [],
    });
    await client.query({
      text: `insert into evals.eval_baseline
  (baseline_id, suite, model_id, metric, git_sha, n_runs, mean, stddev)
values ($1, 'skills', 'synthetic-model-b', 'pass_rate', $2, 3, 0.5, 0.1)`,
      values: [randomUUID(), '0'.repeat(40)],
    });
  };

  const answer = async (path: string) => {
    const routeModule = loaded.get(
      ENTRIES.find((entry) => entry.path === path)?.file ?? '',
    );

    if (routeModule === undefined) {
      throw new Error(`no route module was loaded for ${path}`);
    }

    try {
      const result = await routeModule.loader(
        routeLoaderArgs({
          params: { runId: seeded.runId },
          path,
          search: `?trial=${seeded.trialId}`,
        }) as LoaderFunctionArgs,
      );

      return {
        payload: JSON.stringify(await settle(result)),
        status: result instanceof Response ? result.status : 200,
      };
    } catch (error) {
      return {
        payload: JSON.stringify(await settle(error)),
        status: error instanceof Response ? error.status : 500,
      };
    }
  };

  beforeAll(async () => {
    const admin = await connect();

    await admin.query(`create database "${databaseName}"`);
    await admin.query(
      `create role "${reader.name}" login password '${password}'`,
    );

    const client = await connect(databaseName);
    const migrated = await migrateEvals({
      client,
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [reader],
    });

    expect(migrated.granted.map(({ name }) => name)).toEqual([reader.name]);
    await seedSyntheticHistory({ client, endsOn: '2026-10-01', shape: SHAPE });

    const { rows } = await client.query(`select
  run.run_id::text as "runId", task.task_key as "taskKey", trial.id::text as "trialId"
from evals.eval_run run
join evals.eval_trial trial on trial.run_id = run.run_id
join evals.eval_task_version version on version.id = trial.task_version_id
join evals.eval_task task on task.id = version.task_id
order by run.started_at desc, trial.id
limit 1`);
    const [first] = seededRowsSchema.parse(rows);

    Object.assign(seeded, first);
    await seedOtherTables(client);
    await seedJsonb(client);
    await seedTextColumns(client);

    for (const { file } of ENTRIES) {
      const load = MODULES[file.replace(/^routes\/evals\//u, '../')];

      if (load) {
        loaded.set(file, await load());
      }
    }

    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.stubEnv(
      'EVALS_READER_DATABASE_URL',
      databaseUrl({
        database: databaseName,
        password,
        url: DATABASE_URL ?? '',
        user: reader.name,
      }),
    );
  }, 120_000);

  afterAll(async () => {
    vi.unstubAllEnvs();
    await closeEvalsReaderPool();
    await dispose({ databases: [databaseName], roles: [reader.name] });
  });

  it('seeds the marker where the allow-list says it must not be read', async () => {
    const client = await connect(databaseName);
    const { rows } = await client.query({
      text: `select count(*)::integer as count from evals.eval_run
where settings::text like '%' || $1 || '%'`,
      values: [MARKER],
    });
    const [{ count } = { count: 0 }] = countSchema.parse(rows);

    expect(seededColumns).toEqual(
      expect.arrayContaining([
        'eval_run.actor',
        'eval_subject_version.content',
        'eval_trial.transcript_uri',
        'eval_annotation.text',
        'eval_tool_call.input_summary',
      ]),
    );
    expect(fieldSeedPaths('eval_run.settings')).toContain('argv');
    expect(fieldSeedPaths('eval_trial_detail.detail')).toEqual(
      expect.arrayContaining(['dimensions[].feedback', 'findings', 'summary']),
    );
    expect(count).toBeGreaterThan(0);
  });

  it('loads a module for every /evals route', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
    expect(loaded.keys().toArray()).toEqual(ENTRIES.map(({ file }) => file));
  });

  it.each(ENTRIES.map(({ path }) => ({ path })))(
    '$path answers with seeded public data and without the marker',
    async ({ path }) => {
      const { payload, status } = await answer(path);

      expect(status, payload.slice(0, 400)).toBeGreaterThanOrEqual(200);
      expect(status, payload.slice(0, 400)).toBeLessThan(300);
      expect(
        payload.includes(seeded.runId) || payload.includes(seeded.taskKey),
        'the answer carries none of the seeded rows',
      ).toBe(true);
      expect(payload).not.toContain(MARKER);
    },
    30_000,
  );

  it('makes every column public that carries no free text and is not excluded', async () => {
    const client = await connect(databaseName);
    const publicColumns = await readPublicColumns({ client });
    const columns = await readSchemaColumns({ client });
    const expected = columns
      .filter(
        (column) =>
          !isTextTyped(column) &&
          column.dataType !== 'jsonb' &&
          !(EXCLUDED_TABLES as readonly string[]).includes(column.table) &&
          !(EXCLUDED_COLUMNS as readonly string[]).includes(
            `${column.table}.${column.column}`,
          ),
      )
      .map(({ column, table }) => `${table}.${column}`);

    expect([...publicColumns]).toEqual(expect.arrayContaining(expected));
    expect(publicColumns.has('eval_trial.duration_ms')).toBe(true);
    expect(
      [...publicColumns].filter((column) =>
        column.startsWith('schema_migration.'),
      ),
    ).toEqual([]);
  });

  it('names a schema for every jsonb column and lets no free text pass whole', async () => {
    const client = await connect(databaseName);
    const schemaColumns = await readSchemaColumns({ client });
    const jsonbColumns = schemaColumns
      .filter(({ dataType }) => dataType === 'jsonb')
      .map(({ column, table }) => `${table}.${column}`);

    expect(
      jsonbColumns.toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(
      Object.keys(JSONB_COLUMN_SCHEMAS).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    );

    for (const column of ALLOWED_WHOLE_JSONB) {
      expect(
        freeStringPaths({ schema: JSONB_COLUMN_SCHEMAS[column] }),
        column,
      ).toEqual([]);
    }
  });
});
