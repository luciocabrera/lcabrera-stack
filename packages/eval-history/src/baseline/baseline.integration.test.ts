// @vitest-environment node

/**
 * The baseline against a real Postgres: whether a second model's baseline sits
 * beside the first, and whether the latest one per suite, model and subject is
 * what reads back, are claims about evals.eval_baseline's constraints that a
 * fake client reports green on either way. It creates a database of its own
 * beside the one EVALS_TEST_DATABASE_URL names, migrates it, and drops it
 * afterwards. Unset, it skips locally and fails under CI.
 */

import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import { ingestPaths } from '../ingest/ingestPaths.service.ts';
import { integrationDatabase } from '../ingest/integrationDatabase.util.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { aggregateBaseline } from './aggregateBaseline.util.ts';
import { baselineFixtures } from './baselineFixtures.util.ts';
import { readBaseline } from './readBaseline.service.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';
import { writeBaseline } from './writeBaseline.service.ts';

const {
  scratch: SCRATCH,
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
  const admin = new pg.Client({ connectionString: DATABASE_URL });
  const client = new pg.Client({ connectionString: SCRATCH_URL });

  const record = async (envelopes: readonly RunEnvelope[]) => {
    const ingested = await ingestPaths({
      connectionString: SCRATCH_URL,
      fileSystem: envelopeFileSystem(envelopes),
      paths: ['/results'],
      quietUnreachable: false,
    });

    expect(ingested.exitCode).toBe(0);

    return writeBaseline({ client, rows: aggregateBaseline(envelopes).rows });
  };

  beforeAll(async () => {
    await admin.connect();
    await admin.query(`create database ${SCRATCH}`);
    await client.connect();
    await applyMigrations({ client, migrations: await readMigrations() });
  });

  afterAll(async () => {
    await client.end();
    await admin.query(`drop database if exists ${SCRATCH} with (force)`);
    await admin.end();
  });

  it('keeps each model on rows of its own and reads back the latest per subject', async () => {
    expect(
      await record(
        runsOf({ baselineId: MODEL_A_FIRST, modelId: 'model-a', passes: 1 }),
      ),
    ).toBe(2);
    expect(
      await record(
        runsOf({ baselineId: MODEL_B, modelId: 'model-b', passes: 2 }),
      ),
    ).toBe(2);
    expect(
      await record(
        runsOf({ baselineId: MODEL_A_SECOND, modelId: 'model-a', passes: 4 }),
      ),
    ).toBe(2);

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
