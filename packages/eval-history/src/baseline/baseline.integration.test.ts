// @vitest-environment node

/**
 * The baseline against a real Postgres, written and read as the writer role
 * the migrator grants: whether that role can store and read a baseline,
 * whether a second model's baseline sits beside the first, and whether the
 * latest one per suite, model and subject is what reads back, are claims a
 * fake client reports green on either way. It creates a database and a writer
 * role of its own beside the one EVALS_TEST_DATABASE_URL names, and drops both
 * afterwards. Unset, it skips locally and fails under CI.
 */

import type pg from 'pg';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { SUBJECT_KINDS } from '../envelope/envelope.constants.ts';
import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import { EVALS_WRITER_ROLE } from '../migrate/migrate.constants.ts';
import { migrateEvals } from '../migrate/migrateEvals.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { readModelPrices } from '../prices/readModelPrices.service.ts';
import { integrationDatabase } from '../testing/integrationDatabase.service.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { baselineFixtures } from './baselineFixtures.service.ts';
import { probeDatabase } from './probeDatabase.service.ts';
import { readBaseline } from './readBaseline.service.ts';
import { recordBaseline } from './recordBaseline.service.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const {
  scratch: DATABASE_NAME,
  scratchUrl: SCRATCH_URL,
  url: DATABASE_URL,
} = integrationDatabase({ label: 'baseline' });

const MODEL_A_FIRST = '11111111-1111-4111-8111-111111111111';
const MODEL_A_SECOND = '33333333-3333-4333-8333-333333333333';
const MODEL_B = '22222222-2222-4222-8222-222222222222';

const { skills } = await baselineFixtures();

type RunsOfArgs = {
  readonly baselineId: string;
  readonly modelId: string;
  readonly passes: number;
};

const runsOf = ({ baselineId, modelId, passes }: RunsOfArgs) =>
  [0, 1].map(() =>
    stubBaselineRun({
      baselineId,
      fixture: skills,
      modelId,
      trialsBySkill: {
        'react-19': [0, 1, 2, 3].map((index) => ({
          outcome: index < passes ? 'pass' : 'fail',
        })),
      },
    }),
  );

const probeWith = (client: () => Promise<pg.Client>) =>
  probeDatabase({
    connect: async () => ({
      client: await client(),
      end: () => Promise.resolve(),
    }),
    connectionString: SCRATCH_URL,
  });

describe.skipIf(!DATABASE_URL)('baselines against Postgres', () => {
  const writer = {
    ...EVALS_WRITER_ROLE,
    name: `evals_writer_test_${randomUUID().replaceAll('-', '')}`,
  };
  const stranger = `evals_stranger_test_${randomUUID().replaceAll('-', '')}`;
  const { close, connect, createDatabase } = scratchConnections(
    DATABASE_URL ?? '',
  );

  const clientAs = async (role: string) => {
    const client = await connect(DATABASE_NAME);

    await client.query(`set role "${role}"`);

    return client;
  };

  const writerClient = () => clientAs(writer.name);

  const record = async (args: RunsOfArgs) => {
    const summary = await recordBaseline({
      baselineId: args.baselineId,
      connect: async () => ({
        client: await writerClient(),
        end: () => Promise.resolve(),
      }),
      connectionString: SCRATCH_URL,
      fileSystem: envelopeFileSystem(runsOf(args)),
      paths: ['/results'],
    });

    expect(summary.stderr).toEqual([]);

    return summary.exitCode;
  };

  beforeAll(async () => {
    const admin = await connect();

    await admin.query(`create database "${DATABASE_NAME}"`);
    await admin.query(`create role "${writer.name}" nologin`);
    await admin.query(`create role "${stranger}" nologin`);

    const result = await migrateEvals({
      client: await connect(DATABASE_NAME),
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [writer],
    });

    expect(result.granted.map(({ name }) => name)).toEqual([writer.name]);
  });

  afterAll(() =>
    close({ databases: [DATABASE_NAME], roles: [writer.name, stranger] }),
  );

  it('stores the subject kinds the envelope accepts, and no others', async () => {
    const client = await connect(DATABASE_NAME);
    const { rows } = await client.query<{ readonly kind: string }>(
      'select unnest(enum_range(null::evals.subject_kind))::text as kind',
    );

    expect(rows.map(({ kind }) => kind)).toEqual([...SUBJECT_KINDS]);
  });

  it('passes the writer, and refuses a role without the grant or a database without the schema', async () => {
    const unmigrated = await createDatabase('evals_probe');

    expect(await probeWith(writerClient)).toEqual({ ok: true });
    expect(await probeWith(() => clientAs(stranger))).toMatchObject({
      message: expect.stringMatching(/this role can insert into/u),
      ok: false,
    });
    expect(await probeWith(() => connect(unmigrated))).toMatchObject({
      message: expect.stringMatching(/this role can insert into/u),
      ok: false,
    });
  });

  it('keeps each model on rows of its own and reads back the latest per subject, as the writer', async () => {
    expect(
      await record({
        baselineId: MODEL_A_FIRST,
        modelId: 'model-a',
        passes: 1,
      }),
    ).toBe(0);
    expect(
      await record({ baselineId: MODEL_B, modelId: 'model-b', passes: 2 }),
    ).toBe(0);
    expect(
      await record({
        baselineId: MODEL_A_SECOND,
        modelId: 'model-a',
        passes: 4,
      }),
    ).toBe(0);

    const client = await writerClient();
    const stored = await client.query<{
      readonly model_id: string;
      readonly rows: number;
    }>(
      `select model_id, count(*)::int as rows from evals.eval_baseline
        group by model_id order by model_id`,
    );
    const modelA = await readBaseline({
      client,
      modelId: 'model-a',
      suite: 'skills',
    });
    const modelB = await readBaseline({
      client,
      modelId: 'model-b',
      suite: 'skills',
    });

    expect(stored.rows).toEqual([
      { model_id: 'model-a', rows: 4 },
      { model_id: 'model-b', rows: 2 },
    ]);
    expect(
      modelA.map(({ baselineId, mean, subject }) => [
        baselineId,
        subject,
        mean,
      ]),
    ).toEqual([
      [MODEL_A_SECOND, { kind: 'skill', name: 'react-19' }, 1],
      [MODEL_A_SECOND, undefined, 1],
    ]);
    expect(
      modelB.map(({ baselineId, mean, modelId }) => [
        baselineId,
        modelId,
        mean,
      ]),
    ).toEqual([
      [MODEL_B, 'model-b', 0.5],
      [MODEL_B, 'model-b', 0.5],
    ]);
    expect(
      await readBaseline({ client, modelId: 'model-c', suite: 'skills' }),
    ).toEqual([]);
  });
});
