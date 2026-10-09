// @vitest-environment node

/**
 * The upgrade path of 0003 against a real Postgres: a database migrated to
 * 0002 and holding quality trials written before the judge columns existed
 * gets its judge model and dimension scores backfilled from each detail, and
 * a detail the new constraints cannot hold stops the migration with a message
 * naming the trial. Each case creates a database of its own next to the one
 * EVALS_TEST_DATABASE_URL names and drops it afterwards. Unset, it skips
 * locally and fails under CI.
 */

import type pg from 'pg';

import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { readJudgeAgreement } from './readJudgeAgreement.service.ts';
import { recordHumanGrades } from './recordHumanGrades.service.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');

const JUDGE_MODEL = 'claude-opus-5-5';
const JUDGE_PROMPT_HASH = 'c'.repeat(64);
const FIRST_VERSION_WITH_JUDGE_COLUMNS = 3;

type QualityDetailArgs = {
  readonly dimensions: readonly Readonly<Record<string, unknown>>[];
  readonly judgeModel?: string;
};

const qualityDetail = ({
  dimensions,
  judgeModel = JUDGE_MODEL,
}: QualityDetailArgs) => ({
  dimensions,
  judge_model: judgeModel,
  overall: 3,
  reply_sha256: 'd'.repeat(64),
  schema: 'quality/1',
  summary: 'Fine.',
});

const CLEAN_DIMENSIONS = [
  { feedback: 'Plain.', name: 'clarity', score: 4 },
  { feedback: 'Thin on errors.', name: 'completeness', score: 2 },
];

const SEED_SQL = `
insert into evals.eval_run (run_id, suite, trigger, actor, branch, git_sha, git_dirty, started_at, finished_at, status, model_id, harness_version, schema_version, settings, env, totals, envelope_sha256)
values ('1f07f209-956c-48a0-8945-a2e39ee047a8', 'skill-quality', 'local', 'tester', 'main', repeat('0', 40), false, now(), now(), 'complete', '${JUDGE_MODEL}', 'a8368fc2f15d', 1, '{}', '{}', '{}', repeat('e', 64));
insert into evals.eval_subject (kind, name, path) values ('skill', 'unslop', '.github/skills/unslop');
insert into evals.eval_subject_version (subject_id, content_hash, first_seen_sha, first_seen_at)
select id, repeat('f', 64), repeat('0', 40), now() from evals.eval_subject;
insert into evals.eval_task (suite, subject_id, task_key, kind, task_set)
select 'skill-quality', id, 'skill-quality/unslop', 'quality', 'capability' from evals.eval_subject;
insert into evals.eval_task_version (task_id, task_hash, judge_prompt_hash)
select id, repeat('1', 64), '${JUDGE_PROMPT_HASH}' from evals.eval_task;
insert into evals.eval_trial (run_id, task_version_id, subject_version_id, trial_index, outcome, queued_at)
select '1f07f209-956c-48a0-8945-a2e39ee047a8', task_version.id, subject_version.id, position, 'pass', now()
from evals.eval_task_version task_version, evals.eval_subject_version subject_version, generate_series(0, 1) position;
`;

type SeedArgs = {
  readonly client: pg.Client;
  readonly detail: Readonly<Record<string, unknown>>;
};

const seedOldDatabase = async ({ client, detail }: SeedArgs) => {
  const migrations = await readMigrations();

  await applyMigrations({
    client,
    migrations: migrations.filter(
      ({ version }) => version < FIRST_VERSION_WITH_JUDGE_COLUMNS,
    ),
  });
  await client.query(SEED_SQL);
  await client.query({
    text: `insert into evals.eval_trial_detail (trial_id, detail_schema, detail)
select id, case when trial_index = 0 then 'quality/1' else 'rules/1' end,
  case when trial_index = 0 then $1::jsonb else $2::jsonb end
from evals.eval_trial`,
    values: [detail, { check: 'indexed', findings: [], schema: 'rules/1' }],
  });

  const { rows } = await client.query<{ readonly id: string }>(
    'select id::text as id from evals.eval_trial order by trial_index',
  );

  return {
    migrations,
    quality: rows[0]?.id ?? '',
    rules: rows[1]?.id ?? '',
  };
};

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres judge backfill tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to upgrade under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)(
  '0003 on a database that holds quality trials',
  () => {
    const { close, connect } = scratchConnections(DATABASE_URL ?? '');
    const databases: string[] = [];

    const scratchDatabase = async () => {
      const name = `evals_backfill_${randomUUID().replaceAll('-', '')}`;
      const admin = await connect();

      await admin.query(`create database "${name}"`);
      databases.push(name);

      return connect(name);
    };

    afterAll(() => close({ databases }));

    it('backfills the judge model and dimension scores from each detail', async () => {
      const client = await scratchDatabase();
      const { migrations, quality, rules } = await seedOldDatabase({
        client,
        detail: qualityDetail({ dimensions: CLEAN_DIMENSIONS }),
      });

      const applied = await applyMigrations({ client, migrations });

      expect(applied.map(({ name }) => name)).toEqual([
        '0003-grades-and-annotations.sql',
      ]);

      const { rows: models } = await client.query<{
        readonly judge_model: string;
        readonly trial_id: string;
      }>(
        "select trial_id::text, coalesce(judge_model, 'none') as judge_model from evals.eval_trial_detail order by trial_id",
      );
      const { rows: scores } = await client.query<{
        readonly dimension: string;
        readonly score: number;
        readonly trial_id: string;
      }>(
        'select trial_id::text, dimension, score from evals.eval_judge_score order by trial_id, dimension',
      );

      expect(models).toEqual([
        { judge_model: JUDGE_MODEL, trial_id: quality },
        { judge_model: 'none', trial_id: rules },
      ]);
      expect(scores).toEqual([
        { dimension: 'clarity', score: 4, trial_id: quality },
        { dimension: 'completeness', score: 2, trial_id: quality },
      ]);
      expect(
        await recordHumanGrades({
          client,
          grader: 'lucio',
          scores: [{ dimension: 'completeness', score: 2 }],
          trialId: quality,
        }),
      ).toEqual({ dimensions: ['completeness'], kind: 'recorded' });
      expect(await readJudgeAgreement({ client })).toEqual([
        {
          humanScore: 2,
          judgeModel: JUDGE_MODEL,
          judgePromptHash: JUDGE_PROMPT_HASH,
          judgeScore: 2,
        },
      ]);
    });

    it.each([
      {
        case: 'a blank judge model',
        detail: qualityDetail({ dimensions: CLEAN_DIMENSIONS, judgeModel: '' }),
        reason: 'names no judge_model',
      },
      {
        case: 'a score outside 1 to 5',
        detail: qualityDetail({
          dimensions: [{ feedback: '', name: 'clarity', score: 7 }],
        }),
        reason:
          'scores a dimension without a name, or outside the whole numbers 1 to 5',
      },
      {
        case: 'a fractional score',
        detail: qualityDetail({
          dimensions: [{ feedback: '', name: 'clarity', score: 3.5 }],
        }),
        reason:
          'scores a dimension without a name, or outside the whole numbers 1 to 5',
      },
      {
        case: 'a dimension scored twice',
        detail: qualityDetail({
          dimensions: [
            { feedback: '', name: 'clarity', score: 3 },
            { feedback: '', name: 'clarity', score: 4 },
          ],
        }),
        reason: 'scores a dimension more than once',
      },
    ])(
      'stops on $case, naming the trial, and leaves the database at 0002',
      async ({ detail, reason }) => {
        const client = await scratchDatabase();
        const { migrations, quality } = await seedOldDatabase({
          client,
          detail,
        });

        await expect(
          applyMigrations({ client, migrations }),
        ).rejects.toMatchObject({
          code: '23514',
          message: `quality trial ${quality} ${reason}; fix that row before applying 0003-grades-and-annotations.sql`,
        });

        const { rows } = await client.query<{ readonly version: number }>(
          'select max(version) as version from evals.schema_migration',
        );

        expect(rows[0]?.version).toBe(2);
      },
    );
  },
);
