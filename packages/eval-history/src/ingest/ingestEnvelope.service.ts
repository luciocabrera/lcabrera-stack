import { z } from 'zod';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { IngestClient } from './ingest.types.ts';

import {
  INSERT_RUN_SQL,
  INSERT_TRIAL_SQL,
  SELECT_RUN_SHA_SQL,
  TRANSCRIPT_RETENTION_DAYS,
  UPSERT_SUBJECT_SQL,
  UPSERT_TASK_SQL,
} from './ingest.constants.ts';
import { inSequence } from './inSequence.service.ts';
import { judgeColumns } from './judgeColumns.util.ts';

type IngestEnvelopeArgs = {
  readonly client: IngestClient;
  readonly envelope: RunEnvelope;
  readonly sha256: string;
};

type Run = RunEnvelope['run'];
type Subject = RunEnvelope['subjects'][number];
type Task = RunEnvelope['tasks'][number];
type Trial = RunEnvelope['trials'][number];

const idRowSchema = z.tuple([z.object({ id: z.coerce.number() })]);
const subjectRowSchema = z.tuple([
  z.object({ id: z.coerce.number(), subject_id: z.coerce.number() }),
]);
const shaRowSchema = z.tuple([z.object({ envelope_sha256: z.string() })]);

const DAY_MS = 86_400_000;

const NO_ROWS = { subjects: 0, tasks: 0, trials: 0 };

const subjectKey = ({ kind, name }: Task['subject']) => `${kind}/${name}`;

const runValues = ({ envelope, sha256 }: IngestEnvelopeArgs) => {
  const { run } = envelope;

  return [
    run.run_id,
    run.project,
    run.suite,
    run.trigger,
    run.actor,
    run.branch,
    run.git_sha,
    run.git_dirty,
    run.pr_number,
    run.started_at,
    run.finished_at,
    run.status,
    run.model_id,
    run.harness_version,
    run.sdk_version,
    run.baseline_id,
    run.catalog_hash,
    envelope.schema_version,
    run.settings,
    run.env,
    run.totals,
    sha256,
  ];
};

const transcriptExpiry = (run: Run) =>
  new Date(
    Date.parse(run.finished_at) + TRANSCRIPT_RETENTION_DAYS * DAY_MS,
  ).toISOString();

type TrialValuesArgs = {
  readonly run: Run;
  readonly subjectVersionId: number;
  readonly taskVersionId: number;
  readonly trial: Trial;
};

const trialValues = ({
  run,
  subjectVersionId,
  taskVersionId,
  trial,
}: TrialValuesArgs) => {
  const { dimensions, judgeModel, scores } = judgeColumns(trial.detail);

  return [
    run.run_id,
    taskVersionId,
    subjectVersionId,
    trial.trial_index,
    trial.outcome,
    trial.error_class,
    trial.queued_at,
    trial.started_at,
    trial.first_token_at,
    trial.finished_at,
    trial.duration_ms,
    trial.duration_api_ms,
    trial.turns,
    trial.tokens.input,
    trial.tokens.output,
    trial.tokens.cache_read,
    trial.tokens.cache_write,
    trial.cost_usd_reported,
    trial.transcript?.uri,
    trial.transcript?.sha256,
    trial.transcript?.bytes,
    trial.transcript ? transcriptExpiry(run) : undefined,
    trial.detail.schema,
    trial.detail,
    judgeModel,
    dimensions,
    scores,
  ];
};

type WriteSubjectArgs = {
  readonly client: IngestClient;
  readonly run: Run;
  readonly subject: Subject;
};

const writeSubject = async ({ client, run, subject }: WriteSubjectArgs) => {
  const { rows } = await client.query({
    text: UPSERT_SUBJECT_SQL,
    values: [
      subject.kind,
      subject.name,
      subject.path,
      subject.content_hash,
      run.git_sha,
      run.started_at,
    ],
  });
  const [row] = subjectRowSchema.parse(rows);

  return [subjectKey(subject), row] as const;
};

type SubjectRow = z.output<typeof subjectRowSchema>[0];

type WriteTaskArgs = {
  readonly client: IngestClient;
  readonly run: Run;
  readonly subjects: ReadonlyMap<string, SubjectRow>;
  readonly task: Task;
};

const subjectOf = ({
  subjects,
  task,
}: Pick<WriteTaskArgs, 'subjects' | 'task'>) => {
  const subject = subjects.get(subjectKey(task.subject));

  if (!subject) {
    throw new Error(
      `task ${task.task_key} names subject ${subjectKey(task.subject)}, which no entry in subjects declares`,
    );
  }

  return subject;
};

const writeTask = async ({ client, run, subjects, task }: WriteTaskArgs) => {
  const subject = subjectOf({ subjects, task });
  const { rows } = await client.query({
    text: UPSERT_TASK_SQL,
    values: [
      run.suite,
      subject.subject_id,
      task.task_key,
      task.kind,
      task.set,
      task.source,
      task.tags,
      task.task_hash,
      task.fixture_hash,
      task.expected_hash,
      task.judge_prompt_hash,
      task.agent_prompt_hash,
    ],
  });
  const [row] = idRowSchema.parse(rows);

  return [
    task.task_key,
    { subjectVersionId: subject.id, taskVersionId: row.id },
  ] as const;
};

const writeRows = async ({ client, envelope }: IngestEnvelopeArgs) => {
  const { run } = envelope;
  const subjects = new Map(
    await inSequence({
      items: envelope.subjects,
      step: (subject) => writeSubject({ client, run, subject }),
    }),
  );
  const tasks = new Map(
    await inSequence({
      items: envelope.tasks,
      step: (task) => writeTask({ client, run, subjects, task }),
    }),
  );

  await inSequence({
    items: envelope.trials,
    step: async (trial) => {
      const versions = tasks.get(trial.task_key);

      if (!versions) {
        throw new Error(
          `trial names task ${trial.task_key}, which no task declares`,
        );
      }

      await client.query({
        text: INSERT_TRIAL_SQL,
        values: trialValues({ run, trial, ...versions }),
      });
    },
  });

  return {
    subjects: envelope.subjects.length,
    tasks: envelope.tasks.length,
    trials: envelope.trials.length,
  };
};

const existingOutcome = async ({
  client,
  envelope,
  sha256,
}: IngestEnvelopeArgs) => {
  const { rows } = await client.query({
    text: SELECT_RUN_SHA_SQL,
    values: [envelope.run.run_id],
  });
  const [row] = shaRowSchema.parse(rows);

  return {
    result: row.envelope_sha256 === sha256 ? 'present' : 'conflict',
    rows: NO_ROWS,
  } as const;
};

const writeRun = async (args: IngestEnvelopeArgs) => {
  const { rows } = await args.client.query({
    text: INSERT_RUN_SQL,
    values: runValues(args),
  });

  return rows.length === 0
    ? existingOutcome(args)
    : ({ result: 'inserted', rows: await writeRows(args) } as const);
};

export const ingestEnvelope = async (args: IngestEnvelopeArgs) => {
  await args.client.query({ text: 'begin' });

  try {
    const outcome = await writeRun(args);

    await args.client.query({
      text: outcome.result === 'inserted' ? 'commit' : 'rollback',
    });

    return outcome;
  } catch (error) {
    await args.client.query({ text: 'rollback' });
    throw error;
  }
};
