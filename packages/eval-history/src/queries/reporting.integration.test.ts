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
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { annotationsQuery } from './annotationsQuery.util.ts';
import { columnsNamed } from './columnsNamed.util.ts';
import { flakyTasksQuery } from './flakyTasksQuery.util.ts';
import { EXCLUDED_COLUMNS, REPORTING_RELATIONS } from './queries.constants.ts';
import { readAnnotations } from './readAnnotations.service.ts';
import { readFlakyTasks } from './readFlakyTasks.service.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';
import { readRunComparison } from './readRunComparison.service.ts';
import { readRunCosts } from './readRunCosts.service.ts';
import { readSubjectRuns } from './readSubjectRuns.service.ts';
import { readSubjectTrend } from './readSubjectTrend.service.ts';
import { readTaskPassRates } from './readTaskPassRates.service.ts';
import { runCompareQuery } from './runCompareQuery.util.ts';
import { runCostsQuery } from './runCostsQuery.util.ts';
import { subjectRunsQuery } from './subjectRunsQuery.util.ts';
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

const PRICED_MODEL = {
  id: 'synthetic-model-b',
  usdPerMtok: { cacheRead: 0.3, cacheWrite: 3.75, in: 3, out: 15 },
};

const PROJECTED_QUERIES = {
  annotations: (publicColumns: ReadonlySet<string>) =>
    annotationsQuery({
      from: new Date('2025-01-01T00:00:00Z'),
      publicColumns,
      to: new Date('2027-01-01T00:00:00Z'),
    }),
  runCostsByRun: (publicColumns: ReadonlySet<string>) =>
    runCostsQuery({ groupBy: 'run', perSuite: 30, publicColumns }),
  runCostsBySubject: (publicColumns: ReadonlySet<string>) =>
    runCostsQuery({ groupBy: 'subject', perSuite: 30, publicColumns }),
  runCostsBySuite: (publicColumns: ReadonlySet<string>) =>
    runCostsQuery({ groupBy: 'suite', perSuite: 30, publicColumns }),
  subjectRunsForOne: (publicColumns: ReadonlySet<string>) =>
    subjectRunsQuery({
      publicColumns,
      scope: {
        kind: 'subject',
        perSuite: 400,
        subjectKind: 'skill',
        subjectName: 'synthetic-skill-03',
      },
    }),
  subjectRunsRecent: (publicColumns: ReadonlySet<string>) =>
    subjectRunsQuery({
      publicColumns,
      scope: { kind: 'recent', perSuite: 30 },
    }),
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
  const { close, connect } = scratchConnections(DATABASE_URL ?? '');
  const seeded = { runs: 0, trials: 0 };

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
    await client.query({
      text: `insert into evals.eval_annotation (at, kind, text, author)
values ('2026-06-01T00:00:00Z', 'model-change', $1, $1)`,
      values: [SYNTHETIC_PRIVATE_TEXT],
    });
    await client.query({
      text: `insert into evals.model_price
  (model_id, valid_from, usd_per_mtok_in, usd_per_mtok_out, usd_per_mtok_cache_read, usd_per_mtok_cache_write)
values ($1, '2025-01-01T00:00:00Z', $2, $3, $4, $5)`,
      values: [
        PRICED_MODEL.id,
        PRICED_MODEL.usdPerMtok.in,
        PRICED_MODEL.usdPerMtok.out,
        PRICED_MODEL.usdPerMtok.cacheRead,
        PRICED_MODEL.usdPerMtok.cacheWrite,
      ],
    });
  }, 60_000);

  afterAll(() =>
    close({
      databases: [databaseName, smallDatabaseName],
      roles: [reader.name],
    }),
  );

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

  const timeQuery = async (query: {
    readonly text: string;
    readonly values: unknown[];
  }) => {
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

    return {
      milliseconds:
        (plan?.['Planning Time'] ?? Infinity) +
        (plan?.['Execution Time'] ?? Infinity),
      results,
    };
  };

  it.each(Object.entries(QUERIES).map(([name, query]) => ({ name, query })))(
    '$name answers in under 500 ms by EXPLAIN ANALYZE',
    async ({ query }) => {
      const { milliseconds, results } = await timeQuery(query);

      expect(results.length).toBeGreaterThan(0);
      expect(milliseconds).toBeLessThan(BUDGET_MS);
    },
  );

  it.each(
    Object.entries(PROJECTED_QUERIES).map(([name, build]) => ({ build, name })),
  )('$name answers in under 500 ms by EXPLAIN ANALYZE', async ({ build }) => {
    const publicColumns = await readPublicColumns({
      client: await readerClient(),
    });
    const { milliseconds, results } = await timeQuery(build(publicColumns));

    expect(results.length).toBeGreaterThan(0);
    expect(milliseconds).toBeLessThan(BUDGET_MS);
  });

  it('prices each run from the model price valid when it started, apart from the reported cost', async () => {
    const client = await readerClient();
    const { runs } = await readRunCosts({ client, perSuite: 400 });
    const { rows } = await client.query<{
      readonly computed: number;
      readonly reported: number;
      readonly runId: string;
    }>({
      text: `select
  trial.run_id::text as "runId",
  sum(trial.cost_usd_reported)::double precision as reported,
  (sum(trial.tokens_in * $2::numeric + trial.tokens_out * $3::numeric
    + trial.tokens_cache_read * $4::numeric + trial.tokens_cache_write * $5::numeric) / 1000000)::double precision as computed
from evals.eval_trial trial
join evals.eval_run run on run.run_id = trial.run_id
where run.model_id = $1
group by trial.run_id`,
      values: [
        PRICED_MODEL.id,
        PRICED_MODEL.usdPerMtok.in,
        PRICED_MODEL.usdPerMtok.out,
        PRICED_MODEL.usdPerMtok.cacheRead,
        PRICED_MODEL.usdPerMtok.cacheWrite,
      ],
    });
    const expected = new Map(rows.map((row) => [row.runId, row]));
    const priced = runs.filter(({ modelId }) => modelId === PRICED_MODEL.id);
    const unpriced = runs.filter(({ modelId }) => modelId !== PRICED_MODEL.id);

    expect(priced).toHaveLength(expected.size);
    expect(unpriced.length).toBeGreaterThan(0);

    for (const run of priced) {
      const want = expected.get(run.runId);

      expect(run.computedTrials).toBe(run.trials);
      expect(run.computedUsd).toBeCloseTo(want?.computed ?? NaN, 6);
      expect(run.reportedUsd).toBeCloseTo(want?.reported ?? NaN, 6);
      expect(run.computedUsd).not.toBeCloseTo(run.reportedUsd ?? 0, 6);
    }

    for (const run of unpriced) {
      expect(run.computedTrials).toBe(0);
      expect(run.computedUsd).toBeUndefined();
      expect(run.reportedUsd).toBeGreaterThan(0);
    }
  });

  it('reads one subject run by run, linked to a trial of that subject in that run', async () => {
    const client = await readerClient();
    const runs = await readSubjectRuns({
      client,
      scope: {
        kind: 'subject',
        perSuite: 30,
        subjectKind: 'skill',
        subjectName: 'synthetic-skill-03',
      },
    });
    const { rows } = await client.query<{
      readonly runId: string;
      readonly subjectName: string;
      readonly trialId: string;
    }>({
      text: `select trial.id::text as "trialId", trial.run_id::text as "runId", subject.name as "subjectName"
from evals.eval_trial trial
join evals.eval_subject_version version on version.id = trial.subject_version_id
join evals.eval_subject subject on subject.id = version.subject_id
where trial.id = any($1::bigint[])`,
      values: [runs.map(({ trialId }) => trialId)],
    });

    expect(runs).toHaveLength(30);
    expect(runs.map(({ startedAt }) => startedAt.getTime())).toEqual(
      runs
        .map(({ startedAt }) => startedAt.getTime())
        .toSorted((a, b) => b - a),
    );
    expect(rows).toHaveLength(30);
    expect(
      rows.every(
        (row) =>
          row.subjectName === 'synthetic-skill-03' &&
          runs.some(
            ({ runId, trialId }) =>
              runId === row.runId && trialId === row.trialId,
          ),
      ),
    ).toBe(true);
  });

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

  it('keeps one row per subject and run when the run holds two versions of the subject', async () => {
    const client = await connect(databaseName);
    const scope = {
      kind: 'subject',
      perSuite: 1,
      subjectKind: 'skill',
      subjectName: 'synthetic-skill-03',
    } as const;

    await client.query('begin');

    try {
      const [latest] = await readSubjectRuns({ client, scope });
      const { rowCount } = await client.query({
        text: `update evals.eval_trial trial
set subject_version_id = (
  select other.id from evals.eval_subject_version other
  where other.subject_id = current.subject_id and other.id <> current.id
  order by other.id limit 1
)
from evals.eval_subject_version current
where current.id = trial.subject_version_id
  and trial.id = $1::bigint`,
        values: [latest?.trialId],
      });
      const [mixed, ...rest] = await readSubjectRuns({ client, scope });

      expect(rowCount).toBe(1);
      expect(latest?.contentHashes).toHaveLength(1);
      expect(rest).toEqual([]);
      expect(mixed?.runId).toBe(latest?.runId);
      expect(mixed?.trials).toBe(latest?.trials);
      expect(mixed?.contentHashes).toHaveLength(2);
      expect(mixed?.contentHashes).toContain(latest?.contentHashes[0]);
    } finally {
      await client.query('rollback');
    }
  });

  it('reads the newest runs of each suite that records the subject apart', async () => {
    const client = await connect(databaseName);
    const scope = {
      kind: 'subject',
      perSuite: 2,
      subjectKind: 'skill',
      subjectName: 'synthetic-skill-03',
    } as const;

    await client.query('begin');

    try {
      const { rowCount } = await client.query({
        text: "update evals.eval_run set suite = 'skill-quality' where run_id = $1",
        values: [syntheticRunId(10)],
      });
      const runs = await readSubjectRuns({ client, scope });

      expect(rowCount).toBe(1);
      expect(runs.map(({ runId, suite }) => [suite, runId])).toEqual([
        ['skill-quality', syntheticRunId(10)],
        ['skills', syntheticRunId(365)],
        ['skills', syntheticRunId(364)],
      ]);
    } finally {
      await client.query('rollback');
    }
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
      readRunCosts({ client, perSuite: 30 }),
      readSubjectRuns({ client, scope: { kind: 'recent', perSuite: 30 } }),
      readAnnotations({
        client,
        from: new Date('2025-01-01T00:00:00Z'),
        to: new Date('2027-01-01T00:00:00Z'),
      }),
    ]);

    expect(rows[0]?.count).toBeGreaterThan(0);
    expect(results.at(-1)).toHaveLength(1);
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
