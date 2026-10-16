import { DETAIL_SCHEMA_BY_SUITE } from '../envelope/envelope.constants.ts';
import {
  envelopeShapeSchema,
  runEnvelopeSchema,
} from '../envelope/envelope.schema.ts';
import { schemaSamples } from '../queries/schemaSamples.util.ts';
import { seedFieldPaths } from '../queries/seedFieldPaths.util.ts';

type MarkedEnvelopesArgs = {
  readonly marker: string;
  readonly startedAt: string;
};

type SampleArgs = Omit<Parameters<typeof schemaSamples>[0], 'marker'>;

const { run, subjects, tasks, trials } = envelopeShapeSchema.shape;

const TRIAL_WITHOUT_USAGE = trials.element.omit({ model_usage: true });

const RUN_SEED_PATHS = [
  'actor',
  ...seedFieldPaths('eval_run.settings').map((path) => `settings.${path}`),
  ...seedFieldPaths('eval_run.env').map((path) => `env.${path}`),
];

const TRIAL_SEED_PATHS = [
  'transcript.uri',
  ...seedFieldPaths('eval_trial_detail.detail').map((path) => `detail.${path}`),
];

export const markedEnvelopes = ({ marker, startedAt }: MarkedEnvelopesArgs) => {
  const sample = (args: SampleArgs) => schemaSamples({ ...args, marker });
  const [runSample] = sample({ schema: run, seedPaths: RUN_SEED_PATHS });
  const [subject] = sample({ schema: subjects.element, seedPaths: ['path'] });
  const [task] = sample({ schema: tasks.element, seedPaths: [] });
  const trialSamples = sample({
    schema: TRIAL_WITHOUT_USAGE,
    seedPaths: TRIAL_SEED_PATHS,
  });

  return Object.entries(DETAIL_SCHEMA_BY_SUITE).map(
    ([suite, detailSchema], index) => {
      const taskKey = `${suite}/marked-1`;
      const trial = trialSamples.find((candidate) =>
        JSON.stringify(candidate).includes(`"schema":"${detailSchema}"`),
      );

      return runEnvelopeSchema.parse({
        run: {
          ...(runSample as object),
          run_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
          started_at: startedAt,
          suite,
        },
        schema_version: 1,
        subjects: [subject],
        tasks: [{ ...(task as object), task_key: taskKey }],
        trials: [{ ...(trial as object), model_usage: {}, task_key: taskKey }],
      });
    },
  );
};
