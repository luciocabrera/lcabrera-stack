// @vitest-environment node

/**
 * Adjudication history against a real Postgres: idempotent ingest on
 * case_id, the one-transaction rollback, the latest-true-answer rule of
 * evals.v_adjudication_accuracy and the reopened constraint are claims a fake
 * client reports green on whether or not they hold. It creates a database of
 * its own beside the one EVALS_TEST_DATABASE_URL names, migrates it, and drops
 * it afterwards. Unset, it skips locally and fails under CI.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vite-plus/test';

import type { AdjudicationEnvelope } from '../envelope/envelope.types.ts';
import type { GroundTruth } from './adjudications.types.ts';

import { adjudicationEnvelopeSchema } from '../envelope/adjudicationEnvelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestAdjudication } from '../ingest/ingestAdjudication.service.ts';
import { ingestPaths } from '../ingest/ingestPaths.service.ts';
import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { loadRegressionConfig } from '../stats/loadRegressionConfig.service.ts';
import { integrationDatabase } from '../testing/integrationDatabase.service.ts';
import { readAdjudicationAccuracy } from './readAdjudicationAccuracy.service.ts';
import { recordGroundTruth } from './recordGroundTruth.service.ts';

const {
  scratch: SCRATCH,
  scratchUrl: connectionString,
  url: DATABASE_URL,
} = integrationDatabase({ label: 'adjudications' });

const SCRIPT = fileURLToPath(
  new URL('../../scripts/grade-adjudication.mjs', import.meta.url),
);

const TABLES = [
  'adjudication_case',
  'adjudication_ground_truth',
  'adjudication_verdict',
];

const { minTrialsForRate } = await loadRegressionConfig({
  file: fileURLToPath(
    new URL('../../../../evals/regression.config.json', import.meta.url),
  ),
});

const SQL_NULL: unknown = JSON.parse('null');

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const fixture: AdjudicationEnvelope = adjudicationEnvelopeSchema.parse(
  fixtures.get('adjudication.json'),
);

type CaseArgs = {
  readonly caseId: string;
  readonly outcome: AdjudicationEnvelope['outcome'];
  readonly verdicts: readonly [Verdict, Verdict, Verdict];
};

type Verdict = AdjudicationEnvelope['verifiers'][number]['verdict'];

const caseOf = ({ caseId, outcome, verdicts }: CaseArgs) =>
  adjudicationEnvelopeSchema.parse({
    ...fixture,
    case: { ...fixture.case, case_id: caseId },
    outcome,
    verifiers: fixture.verifiers.map((verifier, index) => ({
      ...verifier,
      verdict: verdicts[index],
    })),
  });

const caseFiles = (envelopes: readonly AdjudicationEnvelope[]) =>
  memoryFileSystem(
    Object.fromEntries(
      envelopes.map((envelope) => [
        `/adjudications/${envelope.case.case_id}.json`,
        JSON.stringify(envelope),
      ]),
    ),
  );

type TruthOfArgs = Partial<Pick<GroundTruth, 'note' | 'source'>> &
  Pick<GroundTruth, 'caseId' | 'truth'>;

const truthOf = ({ caseId, note, source = 'lucio', truth }: TruthOfArgs) =>
  ({ caseId, note, source, truth }) satisfies GroundTruth;

describe.skipIf(!DATABASE_URL)('adjudication history against Postgres', () => {
  const admin = new pg.Client({ connectionString: DATABASE_URL });
  const client = new pg.Client({ connectionString });

  const ingest = async (envelopes: readonly AdjudicationEnvelope[]) => {
    const summary = await ingestPaths({
      connectionString,
      fileSystem: caseFiles(envelopes),
      paths: ['/adjudications'],
      quietUnreachable: false,
    });

    return {
      ...summary,
      results: summary.stdout.map(
        (line) => (JSON.parse(line) as { readonly result: string }).result,
      ),
    };
  };

  const counts = async () => {
    const { rows } = await client.query<{ readonly counts: object }>(
      `select json_build_object(${TABLES.map(
        (table) => `'${table}', (select count(*)::int from evals.${table})`,
      ).join(', ')}) as counts`,
    );

    return rows[0]?.counts;
  };

  beforeAll(async () => {
    await admin.connect();
    await admin.query(`create database ${SCRATCH}`);
    await client.connect();
    await applyMigrations({ client, migrations: await readMigrations() });
  });

  beforeEach(async () => {
    await client.query(
      `truncate ${TABLES.map((table) => `evals.${table}`).join(', ')} cascade`,
    );
  });

  afterAll(async () => {
    await client.end();
    await admin.query(`drop database if exists ${SCRATCH} with (force)`);
    await admin.end();
  });

  it('stores a case and its verdicts, and stores nothing more the second time', async () => {
    const first = await ingest([fixture]);
    const second = await ingest([fixture]);
    const { rows } = await client.query(
      `select verifier_role::text as role, model, verdict::text as verdict,
              duration_ms, tokens_in, tokens_out, cost_usd::float as cost_usd
         from evals.adjudication_verdict
        where case_id = $1
        order by verifier_role, model`,
      ['FP-0001'],
    );

    expect([first.exitCode, second.exitCode]).toEqual([0, 0]);
    expect([...first.results, ...second.results]).toEqual([
      'inserted',
      'present',
    ]);
    expect(await counts()).toEqual({
      adjudication_case: 1,
      adjudication_ground_truth: 0,
      adjudication_verdict: 3,
    });
    expect(rows).toEqual([
      {
        cost_usd: 0.0421,
        duration_ms: 18_250,
        model: 'claude-opus-5-5',
        role: 'judge',
        tokens_in: 12_400,
        tokens_out: 820,
        verdict: 'FALSE_POSITIVE',
      },
      {
        cost_usd: 0.0187,
        duration_ms: 9400,
        model: 'gpt-6',
        role: 'judge',
        tokens_in: 11_800,
        tokens_out: 610,
        verdict: 'FALSE_POSITIVE',
      },
      {
        cost_usd: SQL_NULL,
        duration_ms: 22_100,
        model: 'gemini-4-pro',
        role: 'adversary',
        tokens_in: 13_050,
        tokens_out: 940,
        verdict: 'FALSE_POSITIVE',
      },
    ]);
  });

  it('refuses a different envelope under a stored case id and keeps the first', async () => {
    await ingest([fixture]);
    const changed = await ingest([
      { ...fixture, case: { ...fixture.case, rule: 'another-rule' } },
    ]);
    const { rows } = await client.query<{ readonly rule: string }>(
      'select rule from evals.adjudication_case',
    );

    expect(changed.exitCode).toBe(1);
    expect(changed.results).toEqual(['conflict']);
    expect(rows).toEqual([{ rule: 'no-restricted-syntax' }]);
  });

  it('rolls the case back when one of its verdicts fails to store', async () => {
    const [judge] = fixture.verifiers;
    const repeated = {
      ...fixture,
      verifiers: [judge, judge].filter((verifier) => verifier !== undefined),
    };

    await expect(
      ingestAdjudication({
        client,
        envelope: repeated,
        sha256: 'e'.repeat(64),
      }),
    ).rejects.toMatchObject({ code: '23505' });
    expect(await counts()).toMatchObject({
      adjudication_case: 0,
      adjudication_verdict: 0,
    });
  });

  it('scores each model and role against the latest true answer of each case', async () => {
    await ingest([
      caseOf({
        caseId: 'FP-0101',
        outcome: 'dismissed',
        verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'FALSE_POSITIVE'],
      }),
      caseOf({
        caseId: 'FP-0102',
        outcome: 'split',
        verdicts: ['REAL', 'FALSE_POSITIVE', 'REAL'],
      }),
      caseOf({
        caseId: 'FP-0103',
        outcome: 'split',
        verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'REAL'],
      }),
      caseOf({
        caseId: 'FP-0104',
        outcome: 'fixed',
        verdicts: ['REAL', 'REAL', 'REAL'],
      }),
    ]);

    for (const truth of [
      truthOf({ caseId: 'FP-0101', truth: 'FALSE_POSITIVE' }),
      truthOf({ caseId: 'FP-0102', truth: 'REAL' }),
      truthOf({ caseId: 'FP-0103', truth: 'FALSE_POSITIVE' }),
      truthOf({ caseId: 'FP-0101', source: 'reopened', truth: 'REAL' }),
    ]) {
      await recordGroundTruth({ client, ...truth });
    }

    const { rows } = await client.query(
      `select model, verifier_role::text as role, verdicts, correct,
              missed_real, false_alarms, round(accuracy::numeric, 4)::float as accuracy
         from evals.v_adjudication_accuracy
        order by verifier_role, model`,
    );

    expect(rows).toEqual([
      {
        accuracy: 0.6667,
        correct: 2,
        false_alarms: 0,
        missed_real: 1,
        model: 'claude-opus-5-5',
        role: 'judge',
        verdicts: 3,
      },
      {
        accuracy: 0.3333,
        correct: 1,
        false_alarms: 0,
        missed_real: 2,
        model: 'gpt-6',
        role: 'judge',
        verdicts: 3,
      },
      {
        accuracy: 0.3333,
        correct: 1,
        false_alarms: 1,
        missed_real: 1,
        model: 'gemini-4-pro',
        role: 'adversary',
        verdicts: 3,
      },
    ]);
    expect(await readAdjudicationAccuracy({ client })).toEqual([
      {
        correct: 2,
        falseAlarms: 0,
        missedReal: 1,
        model: 'claude-opus-5-5',
        verdicts: 3,
        verifierRole: 'judge',
      },
      {
        correct: 1,
        falseAlarms: 1,
        missedReal: 1,
        model: 'gemini-4-pro',
        verdicts: 3,
        verifierRole: 'adversary',
      },
      {
        correct: 1,
        falseAlarms: 0,
        missedReal: 2,
        model: 'gpt-6',
        verdicts: 3,
        verifierRole: 'judge',
      },
    ]);
  });

  it('keeps every true answer recorded for a case, oldest first', async () => {
    await ingest([fixture]);
    await recordGroundTruth({
      client,
      ...truthOf({ caseId: 'FP-0001', truth: 'FALSE_POSITIVE' }),
    });
    await recordGroundTruth({
      client,
      ...truthOf({
        caseId: 'FP-0001',
        note: 'a later gate run reported it again',
        source: 'reopened',
        truth: 'REAL',
      }),
    });

    const { rows } = await client.query(
      `select truth::text as truth, source::text as source, note
         from evals.adjudication_ground_truth
        order by recorded_at, id`,
    );

    expect(rows).toEqual([
      { note: SQL_NULL, source: 'lucio', truth: 'FALSE_POSITIVE' },
      {
        note: 'a later gate run reported it again',
        source: 'reopened',
        truth: 'REAL',
      },
    ]);
  });

  it('refuses a reopened true answer that is not REAL, in the database itself', async () => {
    await ingest([fixture]);

    await expect(
      client.query(
        "insert into evals.adjudication_ground_truth (case_id, truth, source) values ('FP-0001', 'FALSE_POSITIVE', 'reopened')",
      ),
    ).rejects.toMatchObject({
      code: '23514',
      constraint: 'adjudication_ground_truth_reopened_is_real',
    });
  });

  it('records a true answer from the command line and prints accuracy per model and role', async () => {
    await ingest([fixture]);

    const graded = spawnSync(
      process.execPath,
      [SCRIPT, '--', 'FP-0001', 'FALSE_POSITIVE', '--note', 'spot-check'],
      {
        encoding: 'utf8',
        env: { EVALS_DATABASE_URL: connectionString, PATH: process.env.PATH },
      },
    );
    const refused = spawnSync(process.execPath, [SCRIPT, 'FP-0002', 'REAL'], {
      encoding: 'utf8',
      env: { EVALS_DATABASE_URL: connectionString, PATH: process.env.PATH },
    });

    expect(graded.status).toBe(0);
    expect(graded.stdout.split('\n')).toEqual([
      'evals:grade-adjudication: recorded FALSE_POSITIVE (lucio) for dismissed case FP-0001',
      `Adjudication accuracy (claude-opus-5-5, judge): insufficient data (n=1 verdicts with a true answer, 1 correct; a rate needs ${String(minTrialsForRate)}); 0 called FALSE_POSITIVE on a real problem, 0 called REAL on a false positive`,
      `Adjudication accuracy (gemini-4-pro, adversary): insufficient data (n=1 verdicts with a true answer, 1 correct; a rate needs ${String(minTrialsForRate)}); 0 called FALSE_POSITIVE on a real problem, 0 called REAL on a false positive`,
      `Adjudication accuracy (gpt-6, judge): insufficient data (n=1 verdicts with a true answer, 1 correct; a rate needs ${String(minTrialsForRate)}); 0 called FALSE_POSITIVE on a real problem, 0 called REAL on a false positive`,
      '',
    ]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toBe(
      'evals:grade-adjudication: case FP-0002 is not stored; ingest its envelope with vp run evals:ingest first\n',
    );
  });
});
