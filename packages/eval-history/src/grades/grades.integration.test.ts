// @vitest-environment node

/**
 * Hand grades, judge scores, annotations and the judge pin against a real
 * Postgres. The quality trial arrives through the ingester, so the score rows
 * and the judge model column the agreement view reads are the ones ingest
 * writes. The constraints and the trigger are claims a fake client reports
 * green on whether or not they hold. It creates a database of its own next to
 * the one EVALS_TEST_DATABASE_URL names and drops it afterwards. Unset, it
 * skips locally and fails under CI.
 */

import type pg from 'pg';

import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { annotationSchema } from '../annotations/annotation.schema.ts';
import { ANNOTATION_KINDS } from '../annotations/annotations.constants.ts';
import { recordAnnotation } from '../annotations/recordAnnotation.service.ts';
import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestEnvelope } from '../ingest/ingestEnvelope.service.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { judgeAgreement } from './judgeAgreement.util.ts';
import { readJudgeAgreement } from './readJudgeAgreement.service.ts';
import { recordHumanGrades } from './recordHumanGrades.service.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const JUDGE_MODEL = 'claude-opus-5-5';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});

const qualityEnvelope = (): RunEnvelope => {
  const envelope = runEnvelopeSchema.parse(fixtures.get('skill-quality.json'));

  return runEnvelopeSchema.parse({
    ...envelope,
    trials: envelope.trials.map((trial) => ({
      ...trial,
      detail: {
        ...trial.detail,
        dimensions: [
          { feedback: 'Plain.', name: 'clarity', score: 4 },
          { feedback: 'Thin on errors.', name: 'completeness', score: 2 },
        ],
        judge_model: JUDGE_MODEL,
      },
    })),
  });
};

type QueryRowArgs = {
  readonly client: pg.Client;
  readonly text: string;
  readonly values?: unknown[];
};

const firstValue = async ({ client, text, values = [] }: QueryRowArgs) => {
  const { rows } = await client.query<{ readonly value: string }>({
    text,
    values,
  });

  return rows[0]?.value ?? '';
};

type InsertDetailArgs = {
  readonly client: pg.Client;
  readonly judgeModel: string;
  readonly trialId: string;
};

const insertQualityDetail = ({
  client,
  judgeModel,
  trialId,
}: InsertDetailArgs) =>
  client.query({
    text: 'insert into evals.eval_trial_detail (trial_id, detail_schema, detail, judge_model) values ($1, $2, $3, $4)',
    values: [
      trialId,
      'quality/1',
      { judge_model: judgeModel, schema: 'quality/1' },
      judgeModel,
    ],
  });

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres grade and annotation tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to grade in under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)(
  'grades and annotations against Postgres',
  () => {
    const databaseName = `evals_grades_${randomUUID().replaceAll('-', '')}`;
    const { close, connect } = scratchConnections(DATABASE_URL ?? '');
    const trials = { blank: '', quality: '', skills: '', unpinned: '' };

    beforeAll(async () => {
      const admin = await connect();

      await admin.query(`create database "${databaseName}"`);
      const client = await connect(databaseName);

      await applyMigrations({ client, migrations: await readMigrations() });
      await ingestEnvelope({
        client,
        envelope: qualityEnvelope(),
        sha256: 'a'.repeat(64),
      });
      await ingestEnvelope({
        client,
        envelope: runEnvelopeSchema.parse(fixtures.get('skills.json')),
        sha256: 'b'.repeat(64),
      });

      const trialOfSuite = (suite: string) =>
        firstValue({
          client,
          text: 'select min(trial.id)::text as value from evals.eval_trial trial join evals.eval_run run on run.run_id = trial.run_id where run.suite = $1',
          values: [suite],
        });
      const quality = await trialOfSuite('skill-quality');
      const copyTrial = (taskVersion: string) =>
        firstValue({
          client,
          text: `insert into evals.eval_trial (run_id, task_version_id, subject_version_id, trial_index, outcome, queued_at)
select run_id, ${taskVersion}, subject_version_id, 100 + (select count(*) from evals.eval_trial), 'pass', now()
from evals.eval_trial where id = $1
returning id::text as value`,
          values: [quality],
        });
      const unpinnedVersion = await firstValue({
        client,
        text: "insert into evals.eval_task_version (task_id, task_hash) select task_version.task_id, repeat('2', 64) from evals.eval_trial trial join evals.eval_task_version task_version on task_version.id = trial.task_version_id where trial.id = $1 returning id::text as value",
        values: [quality],
      });

      Object.assign(trials, {
        blank: await copyTrial('task_version_id'),
        quality,
        skills: await trialOfSuite('skills'),
        unpinned: await copyTrial(unpinnedVersion),
      });
    }, 60_000);

    afterAll(() => close({ databases: [databaseName] }));

    it("writes a quality trial's judge model and dimension scores at ingest", async () => {
      const client = await connect(databaseName);
      const { rows } = await client.query<{
        readonly dimension: string;
        readonly judge_model: string;
        readonly score: number;
      }>({
        text: 'select score.dimension, score.score, trial_detail.judge_model from evals.eval_judge_score score join evals.eval_trial_detail trial_detail on trial_detail.trial_id = score.trial_id where score.trial_id = $1 order by score.dimension',
        values: [trials.quality],
      });

      expect(rows).toEqual([
        { dimension: 'clarity', judge_model: JUDGE_MODEL, score: 4 },
        { dimension: 'completeness', judge_model: JUDGE_MODEL, score: 2 },
      ]);
    });

    it('refuses a quality trial detail with no judge model', async () => {
      const client = await connect(databaseName);

      await expect(
        insertQualityDetail({ client, judgeModel: '', trialId: trials.blank }),
      ).rejects.toMatchObject({
        code: '23514',
        constraint: 'eval_trial_detail_quality_names_judge_model',
      });
    });

    it('refuses a judge model column that disagrees with the detail', async () => {
      const client = await connect(databaseName);

      await expect(
        client.query({
          text: 'insert into evals.eval_trial_detail (trial_id, detail_schema, detail, judge_model) values ($1, $2, $3, $4)',
          values: [
            trials.blank,
            'quality/1',
            { judge_model: 'another-model', schema: 'quality/1' },
            JUDGE_MODEL,
          ],
        }),
      ).rejects.toMatchObject({
        code: '23514',
        constraint: 'eval_trial_detail_judge_model_matches_detail',
      });
    });

    it('refuses a quality trial whose task version has no judge prompt hash', async () => {
      const client = await connect(databaseName);

      await expect(
        insertQualityDetail({
          client,
          judgeModel: JUDGE_MODEL,
          trialId: trials.unpinned,
        }),
      ).rejects.toMatchObject({
        code: '23514',
        message: `quality trial ${trials.unpinned} has no judge prompt hash on its task version`,
      });
    });

    it('stores a hand grade beside the judge score and reports agreement', async () => {
      const client = await connect(databaseName);

      expect(
        await recordHumanGrades({
          client,
          grader: 'lucio',
          scores: [
            { dimension: 'clarity', score: 4 },
            { dimension: 'completeness', score: 4 },
          ],
          trialId: trials.quality,
        }),
      ).toEqual({ dimensions: ['clarity', 'completeness'], kind: 'recorded' });

      const rows = await readJudgeAgreement({ client });

      expect(
        rows.map(({ humanScore, judgeScore }) => [judgeScore, humanScore]),
      ).toEqual([
        [4, 4],
        [2, 4],
      ]);
      expect(rows.every(({ judgeModel }) => judgeModel === JUDGE_MODEL)).toBe(
        true,
      );
      expect(
        rows.every(
          ({ judgePromptHash }) =>
            judgePromptHash === qualityEnvelope().tasks[0]?.judge_prompt_hash,
        ),
      ).toBe(true);
      expect(judgeAgreement({ minN: 1, rows, z: 1.96 })).toMatchObject([
        { agreement: { k: 1, kind: 'rate', n: 2 }, meanGap: 1 },
      ]);
    });

    it("replaces a grader's earlier score instead of adding a second", async () => {
      const client = await connect(databaseName);

      await recordHumanGrades({
        client,
        grader: 'lucio',
        scores: [{ dimension: 'completeness', score: 2 }],
        trialId: trials.quality,
      });
      const rows = await readJudgeAgreement({ client });

      expect(rows.map(({ humanScore }) => humanScore)).toEqual([4, 2]);
    });

    it('writes no grade for a trial that has no judge scores', async () => {
      const client = await connect(databaseName);

      expect(
        await recordHumanGrades({
          client,
          grader: 'lucio',
          scores: [{ dimension: 'clarity', score: 3 }],
          trialId: trials.skills,
        }),
      ).toEqual({
        kind: 'rejected',
        problems: [`trial ${trials.skills} has no quality judgement to grade`],
      });
    });

    it('refuses, in the database, a grade of a dimension the judge did not score', async () => {
      const client = await connect(databaseName);

      await expect(
        client.query({
          text: 'insert into evals.eval_human_grade (trial_id, dimension, score, grader) values ($1, $2, $3, $4)',
          values: [trials.quality, 'tone', 3, 'lucio'],
        }),
      ).rejects.toMatchObject({ code: '23503' });
    });

    it('records an annotation of every kind the enum holds', async () => {
      const client = await connect(databaseName);
      const { rows } = await client.query<{ readonly label: string }>(
        "select enumlabel as label from pg_enum e join pg_type t on t.oid = e.enumtypid join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'evals' and t.typname = 'annotation_kind' order by e.enumsortorder",
      );

      expect(rows.map(({ label }) => label)).toEqual([...ANNOTATION_KINDS]);

      const recorded = await recordAnnotation({
        annotation: annotationSchema.parse({
          at: '2026-10-08T09:00:00.000Z',
          author: 'lucio',
          kind: 'model-change',
          text: 'default model moved',
        }),
        client,
      });

      expect(recorded).toMatchObject({ kind: 'model-change' });
      expect(recorded.at.toISOString()).toBe('2026-10-08T09:00:00.000Z');
    });

    it("removes a trial's judge scores and hand grades when the trial is deleted", async () => {
      const client = await connect(databaseName);
      const countOf = (table: string) =>
        firstValue({
          client,
          text: `select count(*)::text as value from evals.${table} where trial_id = $1`,
          values: [trials.quality],
        });

      expect(await countOf('eval_human_grade')).toBe('2');

      await client.query({
        text: 'delete from evals.eval_trial where id = $1',
        values: [trials.quality],
      });

      expect(await countOf('eval_human_grade')).toBe('0');
      expect(await countOf('eval_judge_score')).toBe('0');
    });
  },
);
