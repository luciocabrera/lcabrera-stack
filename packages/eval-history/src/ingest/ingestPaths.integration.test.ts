// @vitest-environment node

/**
 * Ingest against a real Postgres: idempotency on run_id, the one-transaction
 * rollback and the nulls-not-distinct task-version upsert are claims a fake
 * client reports green on whether or not they hold. It creates a database of
 * its own beside the one EVALS_TEST_DATABASE_URL names, migrates it, and drops
 * it afterwards. Unset, it skips locally and fails under CI.
 */

import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { scratchDatabase } from '../migrate/scratchDatabase.service.ts';
import { ingestPaths } from './ingestPaths.service.ts';
import { memoryFileSystem } from './memoryFileSystem.util.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');
const SCRATCH = `evals_ingest_${String(process.pid)}_${String(Date.now())}`;
const UNREACHABLE_URL = 'postgres://nobody@127.0.0.1:1/evals';
const TASKS = 12;
const TRIALS_PER_TASK = 3;

const TABLES = [
  'eval_run',
  'eval_subject',
  'eval_subject_version',
  'eval_task',
  'eval_task_version',
  'eval_trial',
  'eval_trial_detail',
];

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const fixture: RunEnvelope = runEnvelopeSchema.parse(
  fixtures.get('skills.json'),
);

const hashOf = (index: number) => index.toString(16).padStart(64, '0');

const taskKeyOf = (index: number) => `skills/react-19/trigger-${String(index)}`;

const skillsRun = (runId = randomUUID()): RunEnvelope => {
  const [task] = fixture.tasks;

  if (!task) {
    throw new Error('the skills fixture declares no task');
  }

  const indexes = Array.from({ length: TASKS }, (_, index) => index + 1);

  return {
    ...fixture,
    run: { ...fixture.run, run_id: runId },
    tasks: indexes.map((index) => ({
      ...task,
      task_hash: hashOf(index),
      task_key: taskKeyOf(index),
    })),
    trials: indexes.flatMap((index) =>
      fixture.trials
        .slice(0, TRIALS_PER_TASK)
        .map((trial) => ({ ...trial, task_key: taskKeyOf(index) })),
    ),
  };
};

const filesOf = (envelopes: readonly RunEnvelope[]) =>
  Object.fromEntries(
    envelopes.map((envelope) => [
      `/results/skills/${envelope.run.run_id}.json`,
      JSON.stringify(envelope),
    ]),
  );

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres ingest tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to ingest into under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('ingestPaths against Postgres', () => {
  const { admin, client, connectionString } = scratchDatabase({
    adminUrl: DATABASE_URL,
    name: SCRATCH,
  });
  type IngestArgs = {
    readonly envelopes: readonly RunEnvelope[];
    readonly url?: string;
  };

  const ingest = async ({ envelopes, url = connectionString }: IngestArgs) => {
    const summary = await ingestPaths({
      connectionString: url,
      fileSystem: memoryFileSystem(filesOf(envelopes)),
      paths: ['/results'],
      quietUnreachable: true,
    });

    return {
      ...summary,
      lines: summary.stdout.map(
        (line) =>
          JSON.parse(line) as {
            readonly duration_ms: number;
            readonly result: string;
          },
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

  it('stores one run row and one trial row per trial, with tokens, cost, durations and hashes', async () => {
    const envelope = skillsRun();
    const { exitCode, lines } = await ingest({ envelopes: [envelope] });
    const { rows } = await client.query(
      `select t.tokens_in, t.tokens_out, t.tokens_cache_read, t.tokens_cache_write,
              t.cost_usd_reported::float as cost, t.duration_ms, t.duration_api_ms,
              v.task_hash, s.content_hash, r.catalog_hash, r.harness_version
         from evals.eval_trial t
         join evals.eval_run r using (run_id)
         join evals.eval_task_version v on v.id = t.task_version_id
         join evals.eval_subject_version s on s.id = t.subject_version_id
        where r.run_id = $1 and v.task_hash = $2
        order by t.trial_index`,
      [envelope.run.run_id, hashOf(1)],
    );

    expect(exitCode).toBe(0);
    expect(lines.map(({ result }) => result)).toEqual(['inserted']);
    expect(await counts()).toMatchObject({
      eval_run: 1,
      eval_trial: TASKS * TRIALS_PER_TASK,
      eval_trial_detail: TASKS * TRIALS_PER_TASK,
    });
    expect(rows).toEqual(
      envelope.trials.slice(0, TRIALS_PER_TASK).map((trial) => ({
        catalog_hash: envelope.run.catalog_hash,
        content_hash: envelope.subjects[0]?.content_hash,
        cost: trial.cost_usd_reported,
        duration_api_ms: trial.duration_api_ms,
        duration_ms: trial.duration_ms,
        harness_version: envelope.run.harness_version,
        task_hash: hashOf(1),
        tokens_cache_read: trial.tokens.cache_read,
        tokens_cache_write: trial.tokens.cache_write,
        tokens_in: trial.tokens.input,
        tokens_out: trial.tokens.output,
      })),
    );
  });

  it('ingests a 36-trial envelope in under 2 s', async () => {
    const { lines } = await ingest({ envelopes: [skillsRun()] });

    expect(lines[0]?.duration_ms).toBeLessThan(2000);
  });

  it('gives the same row counts when the same envelope is ingested twice', async () => {
    const envelope = skillsRun();

    await ingest({ envelopes: [envelope] });
    const first = await counts();
    const { exitCode, lines } = await ingest({ envelopes: [envelope] });

    expect(await counts()).toEqual(first);
    expect(exitCode).toBe(0);
    expect(lines.map(({ result }) => result)).toEqual(['present']);
  });

  it('reuses task and subject versions across runs, null prompt hashes included', async () => {
    await ingest({ envelopes: [skillsRun(), skillsRun()] });

    expect(await counts()).toEqual({
      eval_run: 2,
      eval_subject: 1,
      eval_subject_version: 1,
      eval_task: TASKS,
      eval_task_version: TASKS,
      eval_trial: 2 * TASKS * TRIALS_PER_TASK,
      eval_trial_detail: 2 * TASKS * TRIALS_PER_TASK,
    });
  });

  it('keeps a run on disk while the database is down and sends it later', async () => {
    const envelope = skillsRun();
    const down = await ingest({ envelopes: [envelope], url: UNREACHABLE_URL });

    expect(down.exitCode).toBe(0);
    expect(down.lines.map(({ result }) => result)).toEqual(['unsent']);
    expect(await counts()).toMatchObject({ eval_run: 0 });

    const later = await ingest({ envelopes: [envelope] });

    expect(later.lines.map(({ result }) => result)).toEqual(['inserted']);
    expect(await counts()).toMatchObject({ eval_run: 1 });
  });

  it('refuses a different envelope under a stored run_id and changes nothing', async () => {
    const envelope = skillsRun();

    await ingest({ envelopes: [envelope] });
    const before = await counts();
    const { exitCode, lines } = await ingest({
      envelopes: [{ ...envelope, trials: envelope.trials.slice(1) }],
    });

    expect(exitCode).toBe(1);
    expect(lines.map(({ result }) => result)).toEqual(['conflict']);
    expect(await counts()).toEqual(before);
  });

  it('rolls the whole run back when one of its rows fails', async () => {
    const { exitCode, lines } = await ingest({
      envelopes: [{ ...skillsRun(), subjects: [] }],
    });

    expect(exitCode).toBe(1);
    expect(lines.map(({ result }) => result)).toEqual(['failed']);
    expect(await counts()).toMatchObject({ eval_run: 0, eval_trial: 0 });
  });
});
