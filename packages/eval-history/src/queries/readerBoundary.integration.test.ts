// @vitest-environment node

/**
 * The reader role's privileges are the reporting privacy boundary (ADR-137).
 * Each probe creates, inside a transaction it rolls back, a reporting relation
 * that reads excluded data, and asserts that Postgres refuses it to the reader
 * or that the catalog checks below name it. Needs EVALS_TEST_DATABASE_URL; it
 * creates and drops a database and a role of its own, skips locally without
 * the variable and fails under CI.
 */

import type pg from 'pg';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { readBaseline } from '../baseline/readBaseline.service.ts';
import { readJudgeAgreement } from '../grades/readJudgeAgreement.service.ts';
import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { inSequence } from '../ingest/inSequence.service.ts';
import { grantStatements } from '../migrate/grantStatements.util.ts';
import { EVALS_READER_ROLE } from '../migrate/migrate.constants.ts';
import { migrateEvals } from '../migrate/migrateEvals.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { resolveGrants } from '../migrate/resolveGrants.service.ts';
import { revokeStatements } from '../migrate/revokeStatements.util.ts';
import { readModelPrices } from '../prices/readModelPrices.service.ts';
import { readLatestRunId } from '../report/readLatestRunId.service.ts';
import { readReportRun } from '../report/readReportRun.service.ts';
import { SYNTHETIC_PRIVATE_TEXT } from '../seed/seed.constants.ts';
import { seedSyntheticHistory } from '../seed/seedSyntheticHistory.service.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { publicFieldsExpression } from './publicFieldsExpression.util.ts';
import { PUBLIC_JSONB_COLUMNS } from './queries.constants.ts';
import { readAnnotations } from './readAnnotations.service.ts';
import { readerColumns } from './readerColumns.util.ts';
import { readFlakyTasks } from './readFlakyTasks.service.ts';
import { readSchemaColumns } from './readPublicColumns.service.ts';
import { readRunSummaries } from './readRunSummaries.service.ts';
import { readRunTrials } from './readRunTrials.service.ts';
import { readSubjectTrend } from './readSubjectTrend.service.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const USER_SCHEMA = String.raw`n.nspname not in ('pg_catalog', 'information_schema')
  and n.nspname not like 'pg\_toast%'
  and n.nspname not like 'pg\_temp%'`;

const READABLE_COLUMNS_SQL = `select n.nspname || '.' || c.relname || '.' || a.attname as name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where ${USER_SCHEMA}
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
  and has_column_privilege($1, c.oid, a.attnum, 'select')`;

const DEFINER_VIEWS_SQL = `select n.nspname || '.' || c.relname as name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where ${USER_SCHEMA}
  and c.relkind = 'v'
  and has_table_privilege($1, c.oid, 'select')
  and not coalesce(
    (
      select reloption.option_value::boolean
      from pg_options_to_table(c.reloptions) reloption
      where reloption.option_name = 'security_invoker'
    ),
    false
  )`;

const DEFINER_FUNCTIONS_SQL = `select n.nspname || '.' || p.proname as name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef and has_function_privilege($1, p.oid, 'execute')`;

const VIEW_COLUMNS_SQL = `select 'evals.' || c.relname || '.' || a.attname as name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where n.nspname = 'evals' and c.relkind = 'v'`;

const GENERATED_SQL = `select pg_get_expr(d.adbin, d.adrelid) as expression
from pg_attribute a
join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where a.attrelid = $1::regclass and a.attname = $2 and a.attgenerated = 's'`;

const nameRowsSchema = z.array(z.object({ name: z.string() }));

const expressionRowsSchema = z.array(z.object({ expression: z.string() }));

const FLAKY_SIGNATURE = `evals.flaky_tasks(run_window integer)
returns table (suite text, task_key text, runs integer, disagreeing integer, disagree_fraction double precision)`;

const PUBLIC_FLAKY_SIGNATURE = FLAKY_SIGNATURE.replace(
  'evals.flaky_tasks',
  'public.flaky_tasks',
);

const WHOLE_ROW_READS = {
  annotationAndGradeByJoinAlias:
    "select to_jsonb(note) ->> 'author' as leak, to_jsonb(grade) ->> 'grader' as grader from evals.eval_annotation note join evals.eval_human_grade grade on true",
  detailByWholeRow:
    "select to_jsonb(trial_detail) -> 'detail' as leak from evals.eval_trial_detail trial_detail",
  graderByWholeRow:
    "select to_jsonb(grade.*) ->> 'grader' as leak from evals.eval_human_grade grade",
  settingsByWholeRow:
    "select to_jsonb(run) -> 'settings' as leak from evals.eval_run run",
  transcriptByWholeRow:
    "select to_jsonb(trial.*) ->> 'transcript_uri' as leak from evals.eval_trial trial",
};

const DYNAMIC_READS = {
  migrationLedger: 'select version, name, sha256 from evals.schema_migration',
  queryToXml:
    "select query_to_xml('select trial.transcript_uri, run.actor from evals.eval_trial trial join evals.eval_run run on run.run_id = trial.run_id', true, false, '') as leak",
  sameNamedFunctionInAnotherSchema: 'select * from public.flaky_tasks(10)',
};

const FUNCTION_BODIES = {
  dynamicSqlInPlpgsql: `language plpgsql stable as $$
begin
  return query execute 'select transcript_uri, null::text, 0, 0, 0::double precision from evals.eval_trial';
end
$$`,
  wholeRowInSql: `language sql stable as $$
  select string_agg(note::text, ','), null::text, 0, 0, 0::double precision
  from evals.eval_annotation note
$$`,
};

const PUBLIC_FLAKY_TASKS = `create function ${PUBLIC_FLAKY_SIGNATURE}
language sql stable as $$
  select transcript_uri, null::text, 0, 0, 0::double precision from evals.eval_trial
$$`;

type ReplaceSubjectTrendArgs = {
  readonly isInvoker: boolean;
  readonly sql: string;
};

const replaceSubjectTrend = ({ isInvoker, sql }: ReplaceSubjectTrendArgs) => [
  'drop view evals.v_subject_trend',
  `create view evals.v_subject_trend${isInvoker ? ' with (security_invoker = true)' : ''} as ${sql}`,
];

const probes = (reads: Readonly<Record<string, string>>) =>
  Object.entries(reads).map(([name, sql]) => ({
    name,
    setup:
      name === 'sameNamedFunctionInAnotherSchema' ? [PUBLIC_FLAKY_TASKS] : [],
    sql,
  }));

type NamesArgs = {
  readonly client: pg.Client;
  readonly text: string;
};

type ProbeArgs = {
  readonly check: (client: pg.Client) => Promise<void>;
  readonly statements: readonly string[];
};

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres reader boundary tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to probe under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('the reader boundary against Postgres', () => {
  const suffix = randomUUID().replaceAll('-', '');
  const databaseName = `evals_boundary_${suffix}`;
  const reader = { ...EVALS_READER_ROLE, name: `evals_reader_bound_${suffix}` };
  const { close, connect } = scratchConnections(DATABASE_URL ?? '');
  const seeded = { runId: '', trialId: '' };
  const connections: { owner?: pg.Client } = {};

  const owner = () => {
    if (connections.owner === undefined) {
      throw new Error('the owner connection opens in beforeAll');
    }

    return connections.owner;
  };

  beforeAll(async () => {
    const admin = await connect();

    await admin.query(`create database "${databaseName}"`);
    await admin.query(`create role "${reader.name}" nologin`);

    const client = await connect(databaseName);

    Object.assign(connections, { owner: client });
    await migrateEvals({
      client,
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [reader],
    });
    await seedSyntheticHistory({
      client,
      endsOn: '2026-10-01',
      shape: { nights: 4, subjects: 2, trialsPerTask: 1 },
    });

    const { rows } = await client.query<{
      readonly runId: string;
      readonly trialId: string;
    }>(
      'select trial.run_id::text as "runId", trial.id::text as "trialId" from evals.eval_trial trial order by trial.id limit 1',
    );

    Object.assign(seeded, rows[0]);
    await client.query({
      text: `insert into evals.eval_trial_detail (trial_id, detail_schema, detail)
values ($1, 'skills/1', jsonb_build_object(
  'schema', 'skills/1', 'expected_skill', 'synthetic-skill-01', 'invoked', jsonb_build_array('synthetic-skill-01'),
  'init_tools', jsonb_build_array($2::text), 'should_trigger', true, 'fixture_read', null))`,
      values: [seeded.trialId, SYNTHETIC_PRIVATE_TEXT],
    });
    await client.query({
      text: `update evals.eval_run set env = env || jsonb_build_object('os', 'linux', 'hostname', $1::text) where run_id = $2`,
      values: [SYNTHETIC_PRIVATE_TEXT, seeded.runId],
    });
    await client.query({
      text: "insert into evals.eval_annotation (at, kind, text, author) values ('2026-09-30T00:00:00Z', 'note', $1, $1)",
      values: [SYNTHETIC_PRIVATE_TEXT],
    });
  }, 60_000);

  afterAll(() => close({ databases: [databaseName], roles: [reader.name] }));

  const names = async ({ client, text }: NamesArgs) => {
    const { rows } = await client.query({ text, values: [reader.name] });

    return nameRowsSchema
      .parse(rows)
      .map(({ name }) => name)
      .toSorted(compareCodeUnits);
  };

  const boundaryProblems = async (client: pg.Client) => {
    const viewColumns = await client.query(VIEW_COLUMNS_SQL);
    const expected = new Set([
      ...[...readerColumns(await readSchemaColumns({ client }))].map(
        (column) => `evals.${column}`,
      ),
      ...nameRowsSchema.parse(viewColumns.rows).map(({ name }) => name),
    ]);
    const readable = await names({ client, text: READABLE_COLUMNS_SQL });

    return {
      definerFunctions: await names({ client, text: DEFINER_FUNCTIONS_SQL }),
      definerViews: await names({ client, text: DEFINER_VIEWS_SQL }),
      unexpectedColumns: readable.filter((name) => !expected.has(name)),
    };
  };

  const grantAsMigrator = async (client: pg.Client) => {
    const resolved = await resolveGrants({ client, role: reader });

    await client.query(
      [...revokeStatements(reader), ...grantStatements(resolved)].join(';\n'),
    );
  };

  const inProbe = async ({ check, statements }: ProbeArgs) => {
    const client = owner();

    await client.query('begin');

    try {
      await inSequence({
        items: statements,
        step: (statement) => client.query(statement),
      });
      await grantAsMigrator(client);
      await check(client);
    } finally {
      await client.query('rollback');
    }
  };

  const refusedToReader = async ({ client, text }: NamesArgs) => {
    await client.query('savepoint probe');
    await client.query(`set local role "${reader.name}"`);

    try {
      await expect(client.query(text)).rejects.toMatchObject({
        code: '42501',
      });
    } finally {
      await client.query('rollback to savepoint probe');
    }
  };

  const readerClient = async () => {
    const client = await connect(databaseName);

    await client.query(`set role "${reader.name}"`);

    return client;
  };

  it('leaves the reader the public columns and the views, and nothing else', async () => {
    const client = owner();
    const readable = await names({ client, text: READABLE_COLUMNS_SQL });

    expect(await boundaryProblems(client)).toEqual({
      definerFunctions: [],
      definerViews: [],
      unexpectedColumns: [],
    });
    expect(readable).toEqual(
      expect.arrayContaining([
        'evals.eval_trial.outcome',
        'evals.eval_trial_detail.detail_public',
        'evals.v_judge_agreement.judge_model',
      ]),
    );
    expect(
      readable.filter((name) =>
        [
          'evals.eval_annotation.text',
          'evals.eval_human_grade.grader',
          'evals.eval_run.actor',
          'evals.eval_run.settings',
          'evals.eval_trial.transcript_uri',
          'evals.eval_trial_detail.detail',
          'evals.schema_migration.version',
        ].includes(name),
      ),
    ).toEqual([]);
  });

  it('names a column granted beyond the public set', async () => {
    await inProbe({
      check: async (client) => {
        await client.query(
          `grant select on evals.eval_trial, public.leak to "${reader.name}"`,
        );

        const { unexpectedColumns } = await boundaryProblems(client);

        expect(unexpectedColumns).toContain('evals.eval_trial.transcript_uri');
        expect(unexpectedColumns).toContain('public.leak.actor');
      },
      statements: [
        'create table public.leak as select actor from evals.eval_run',
      ],
    });
  });

  it.each(
    Object.entries(PUBLIC_JSONB_COLUMNS).map(([source, copy]) => ({
      copy,
      source,
    })),
  )(
    'copies only the allowed fields of $source into $copy',
    async ({ copy, source }) => {
      const client = owner();
      const [table = '', column = ''] = source.split('.', 2);

      await client.query('begin');

      try {
        await client.query(
          `create temp table expected_copy (${column} jsonb, ${copy} jsonb generated always as (${publicFieldsExpression(source)}) stored)`,
        );

        const read = async (relation: string) => {
          const { rows } = await client.query({
            text: GENERATED_SQL,
            values: [relation, copy],
          });

          return expressionRowsSchema
            .parse(rows)
            .map(({ expression }) => expression);
        };
        const expected = await read('pg_temp.expected_copy');

        expect(expected).toHaveLength(1);
        expect(await read(`evals.${table}`)).toEqual(expected);
      } finally {
        await client.query('rollback');
      }
    },
  );

  it.each(probes(WHOLE_ROW_READS))(
    'refuses the reader a whole-row read, $name, in a reporting view',
    async ({ sql }) => {
      await inProbe({
        check: (client) =>
          refusedToReader({
            client,
            text: 'select * from evals.v_subject_trend',
          }),
        statements: replaceSubjectTrend({ isInvoker: true, sql }),
      });
    },
  );

  it.each(probes(DYNAMIC_READS))(
    'refuses the reader $name in a reporting view',
    async ({ setup, sql }) => {
      await inProbe({
        check: (client) =>
          refusedToReader({
            client,
            text: 'select * from evals.v_subject_trend',
          }),
        statements: [
          ...setup,
          ...replaceSubjectTrend({ isInvoker: true, sql }),
        ],
      });
    },
  );

  it.each(probes({ ...WHOLE_ROW_READS, ...DYNAMIC_READS }))(
    'names a reporting view, $name, that does not run with the reader privileges',
    async ({ setup, sql }) => {
      await inProbe({
        check: async (client) => {
          const { definerViews } = await boundaryProblems(client);

          expect(definerViews).toEqual(['evals.v_subject_trend']);
        },
        statements: [
          ...setup,
          ...replaceSubjectTrend({ isInvoker: false, sql }),
        ],
      });
    },
  );

  it('names a same-named function in another schema that runs with its owner privileges', async () => {
    await inProbe({
      check: async (client) => {
        const { definerFunctions } = await boundaryProblems(client);

        expect(definerFunctions).toEqual(['public.flaky_tasks']);
      },
      statements: [
        PUBLIC_FLAKY_TASKS.replace('stable as', 'stable security definer as'),
        ...replaceSubjectTrend({
          isInvoker: true,
          sql: DYNAMIC_READS.sameNamedFunctionInAnotherSchema,
        }),
      ],
    });
  });

  it.each(probes(FUNCTION_BODIES))(
    'refuses the reader a reporting function whose body reads excluded data, $name',
    async ({ sql }) => {
      await inProbe({
        check: (client) =>
          refusedToReader({
            client,
            text: 'select * from evals.flaky_tasks(10)',
          }),
        statements: [`create or replace function ${FLAKY_SIGNATURE}\n${sql}`],
      });
    },
  );

  it.each(probes(FUNCTION_BODIES))(
    'names a reporting function, $name, that runs with its owner privileges',
    async ({ sql }) => {
      await inProbe({
        check: async (client) => {
          const { definerFunctions } = await boundaryProblems(client);

          expect(definerFunctions).toEqual(['evals.flaky_tasks']);
        },
        statements: [
          `create or replace function ${FLAKY_SIGNATURE}\n${sql.replace(' stable as', ' stable security definer as')}`,
        ],
      });
    },
  );

  it('serves the dashboard and the CLI readers to the reader, with none of the private text', async () => {
    const client = await readerClient();
    const [summary] = await readRunSummaries({
      client,
      scope: { kind: 'run', runId: seeded.runId },
    });
    const trials = await readRunTrials({
      client,
      limit: 10,
      offset: 0,
      runId: seeded.runId,
      sorting: [],
      trialId: seeded.trialId,
    });
    const results = [
      summary,
      trials,
      await readSubjectTrend({
        client,
        kind: 'skill',
        limit: 10,
        name: 'synthetic-skill-01',
      }),
      await readFlakyTasks({ client, disagreeFraction: 0, window: 10 }),
      await readAnnotations({
        client,
        from: new Date('2025-01-01T00:00:00Z'),
        to: new Date('2027-01-01T00:00:00Z'),
      }),
      await readReportRun({ client, runId: seeded.runId }),
      await readLatestRunId({ branch: 'main', client, suite: 'skills' }),
      await readJudgeAgreement({ client }),
      await readBaseline({
        client,
        modelId: 'synthetic-model-b',
        suite: 'skills',
      }),
    ];

    expect(summary).toMatchObject({ node: 'synthetic', os: 'linux', runs: 1 });
    expect(trials.data).toMatchObject([
      { expectedSkill: 'synthetic-skill-01', invoked: ['synthetic-skill-01'] },
    ]);
    expect(results.at(-4)).toMatchObject({ runId: seeded.runId });
    expect(results.at(-3)).toMatch(/^[\da-f-]{36}$/u);
    expect(JSON.stringify(results)).not.toContain(SYNTHETIC_PRIVATE_TEXT);
  });
});
