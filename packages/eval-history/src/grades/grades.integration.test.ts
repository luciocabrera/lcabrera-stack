// @vitest-environment node

/**
 * Hand grades, annotations and the judge pin against a real Postgres: the
 * agreement view joins a hand grade to the judge's score inside jsonb, and the
 * constraint and trigger that keep a quality trial's judge model and prompt
 * hash are claims a fake client reports green on whether or not they hold. It
 * creates a database of its own next to the one EVALS_TEST_DATABASE_URL names
 * and drops it afterwards. Unset, it skips locally and fails under CI.
 */

import type pg from 'pg';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { annotationSchema } from '../annotations/annotation.schema.ts';
import { ANNOTATION_KINDS } from '../annotations/annotations.constants.ts';
import { recordAnnotation } from '../annotations/recordAnnotation.service.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { scratchConnections } from '../queries/scratchConnections.service.ts';
import { judgeAgreement } from './judgeAgreement.util.ts';
import { readJudgeAgreement } from './readJudgeAgreement.service.ts';
import { recordHumanGrades } from './recordHumanGrades.service.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const RUN_ID = '1f07f209-956c-48a0-8945-a2e39ee047a8';
const JUDGE_MODEL = 'claude-opus-5-5';
const JUDGE_PROMPT_HASH = 'c'.repeat(64);

const qualityDetail = (judgeModel: string) => ({
  dimensions: [
    { feedback: 'Plain.', name: 'clarity', score: 4 },
    { feedback: 'Thin on errors.', name: 'completeness', score: 2 },
  ],
  judge_model: judgeModel,
  overall: 3,
  reply_sha256: 'd'.repeat(64),
  schema: 'quality/1',
  summary: 'Fine.',
});

const FIXTURE_SQL = `
insert into evals.eval_run (run_id, suite, trigger, actor, branch, git_sha, git_dirty, started_at, finished_at, status, model_id, harness_version, schema_version, settings, env, totals, envelope_sha256)
values ('${RUN_ID}', 'skill-quality', 'local', 'tester', 'main', '${'0'.repeat(40)}', false, now(), now(), 'complete', '${JUDGE_MODEL}', 'a8368fc2f15d', 1, '{}', '{}', '{}', '${'e'.repeat(64)}');
insert into evals.eval_subject (kind, name, path) values ('skill', 'unslop', '.github/skills/unslop');
insert into evals.eval_subject_version (subject_id, content_hash, first_seen_sha, first_seen_at)
select id, '${'f'.repeat(64)}', '${'0'.repeat(40)}', now() from evals.eval_subject;
insert into evals.eval_task (suite, subject_id, task_key, kind, task_set)
select 'skill-quality', id, 'skill-quality/unslop', 'quality', 'capability' from evals.eval_subject;
insert into evals.eval_task (suite, subject_id, task_key, kind, task_set)
select 'skills', id, 'skills/unslop/trigger-1', 'trigger', 'regression' from evals.eval_subject;
insert into evals.eval_task_version (task_id, task_hash, judge_prompt_hash)
select id, '${'1'.repeat(64)}', '${JUDGE_PROMPT_HASH}' from evals.eval_task where task_key = 'skill-quality/unslop';
insert into evals.eval_task_version (task_id, task_hash)
select id, '${'2'.repeat(64)}' from evals.eval_task where task_key = 'skill-quality/unslop';
insert into evals.eval_task_version (task_id, task_hash)
select id, '${'3'.repeat(64)}' from evals.eval_task where task_key = 'skills/unslop/trigger-1';
insert into evals.eval_trial (run_id, task_version_id, subject_version_id, trial_index, outcome, queued_at)
select '${RUN_ID}', task_version.id, (select id from evals.eval_subject_version), row_number() over (order by task_version.task_hash) - 1, 'pass', now()
from evals.eval_task_version task_version;
`;

type InsertDetailArgs = {
  readonly client: pg.Client;
  readonly detail: Readonly<Record<string, unknown>>;
  readonly trialId: string;
};

type TrialIdOfArgs = {
  readonly client: pg.Client;
  readonly taskHashDigit: string;
};

const trialIdOf = async ({ client, taskHashDigit }: TrialIdOfArgs) => {
  const { rows } = await client.query<{ readonly id: string }>({
    text: 'select trial.id::text as id from evals.eval_trial trial join evals.eval_task_version task_version on task_version.id = trial.task_version_id where task_version.task_hash = $1',
    values: [taskHashDigit.repeat(64)],
  });
  const [row] = rows;

  if (!row) {
    throw new Error(`no trial for task hash ${taskHashDigit}`);
  }

  return row.id;
};

const insertDetail = ({ client, detail, trialId }: InsertDetailArgs) =>
  client.query({
    text: 'insert into evals.eval_trial_detail (trial_id, detail_schema, detail) values ($1, $2, $3)',
    values: [trialId, detail.schema, detail],
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
    const trials = { pinned: '', skills: '', unpinned: '' };

    beforeAll(async () => {
      const admin = await connect();

      await admin.query(`create database "${databaseName}"`);
      const client = await connect(databaseName);

      await applyMigrations({ client, migrations: await readMigrations() });
      await client.query(FIXTURE_SQL);
      Object.assign(trials, {
        pinned: await trialIdOf({ client, taskHashDigit: '1' }),
        skills: await trialIdOf({ client, taskHashDigit: '3' }),
        unpinned: await trialIdOf({ client, taskHashDigit: '2' }),
      });
      await insertDetail({
        client,
        detail: qualityDetail(JUDGE_MODEL),
        trialId: trials.pinned,
      });
    }, 60_000);

    afterAll(() => close({ databases: [databaseName] }));

    it('refuses a quality trial detail with no judge model', async () => {
      const client = await connect(databaseName);

      await expect(
        insertDetail({
          client,
          detail: qualityDetail(''),
          trialId: trials.unpinned,
        }),
      ).rejects.toMatchObject({ code: '23514' });
    });

    it('refuses a quality trial whose task version has no judge prompt hash', async () => {
      const client = await connect(databaseName);

      await expect(
        insertDetail({
          client,
          detail: qualityDetail(JUDGE_MODEL),
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
          trialId: trials.pinned,
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
          ({ judgePromptHash }) => judgePromptHash === JUDGE_PROMPT_HASH,
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
        trialId: trials.pinned,
      });
      const rows = await readJudgeAgreement({ client });

      expect(rows.map(({ humanScore }) => humanScore)).toEqual([4, 2]);
    });

    it('writes no grade for a trial that has no quality judgement', async () => {
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
  },
);
