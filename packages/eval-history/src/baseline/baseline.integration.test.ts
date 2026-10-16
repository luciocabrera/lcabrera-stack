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

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import { EVALS_WRITER_ROLE } from '../migrate/migrate.constants.ts';
import { migrateEvals } from '../migrate/migrateEvals.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { readModelPrices } from '../prices/readModelPrices.service.ts';
import { integrationDatabase } from '../testing/integrationDatabase.util.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { baselineFixtures } from './baselineFixtures.util.ts';
import { readBaseline } from './readBaseline.service.ts';
import { recordBaseline } from './recordBaseline.service.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';

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

describe.skipIf(!DATABASE_URL)('baselines against Postgres', () => {
  const writer = {
    ...EVALS_WRITER_ROLE,
    name: `evals_writer_test_${randomUUID().replaceAll('-', '')}`,
  };
  const { close, connect } = scratchConnections(DATABASE_URL ?? '');

  const writerClient = async () => {
    const client = await connect(DATABASE_NAME);

    await client.query(`set role "${writer.name}"`);

    return client;
  };

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

    const result = await migrateEvals({
      client: await connect(DATABASE_NAME),
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [writer],
    });

    expect(result.granted.map(({ name }) => name)).toEqual([writer.name]);
  });

  afterAll(() => close({ databases: [DATABASE_NAME], roles: [writer.name] }));

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
