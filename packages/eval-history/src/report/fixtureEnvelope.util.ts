import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { Outcome } from '../stats/stats.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';

type FixtureEnvelopeArgs = {
  readonly base: RunEnvelope;
  readonly branch?: string;
  readonly catalogHash?: string;
  readonly contentHash?: string;
  readonly costUsd?: number;
  readonly durationMs?: number;
  readonly modelId?: string;
  readonly outcomes: Readonly<Record<string, readonly Outcome[]>>;
  readonly runId: string;
};

export const fixtureEnvelope = ({
  base,
  branch = 'main',
  catalogHash = base.run.catalog_hash ?? sha256Hex('catalog'),
  contentHash = base.subjects[0]?.content_hash ?? sha256Hex('content'),
  costUsd = 1.2,
  durationMs = 12_000,
  modelId = 'claude-opus-5-5',
  outcomes,
  runId,
}: FixtureEnvelopeArgs) => {
  const [task] = base.tasks;
  const [trial] = base.trials;
  const [subject] = base.subjects;

  if (task === undefined || trial === undefined || subject === undefined) {
    throw new Error('the skills fixture lost its task, trial or subject');
  }

  const taskKeys = Object.keys(outcomes);

  return runEnvelopeSchema.parse({
    ...base,
    run: {
      ...base.run,
      branch,
      catalog_hash: catalogHash,
      model_id: modelId,
      run_id: runId,
      totals: { ...base.run.totals, cost_usd_reported: costUsd },
    },
    subjects: [{ ...subject, content_hash: contentHash }],
    tasks: taskKeys.map((taskKey) => ({
      ...task,
      task_hash: sha256Hex(taskKey),
      task_key: taskKey,
    })),
    trials: taskKeys.flatMap((taskKey) =>
      (outcomes[taskKey] ?? []).map((outcome, index) => ({
        ...trial,
        duration_ms: durationMs + index * 1000,
        error_class:
          outcome === 'error' ? 'error_max_turns' : trial.error_class,
        outcome,
        task_key: taskKey,
        trial_index: index,
      })),
    ),
  });
};
