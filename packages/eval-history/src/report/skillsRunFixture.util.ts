import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { Outcome } from '../stats/stats.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { ALL_PASS } from './report.constants.ts';

type SkillsRunFixtureArgs = {
  readonly base: RunEnvelope;
  readonly branch?: string;
  readonly hidden?: readonly string[];
  readonly modelId?: string;
  readonly outcomesOf?: (taskKey: string) => readonly Outcome[];
  readonly runId: string;
};

const SKILLS = ['react-19', 'store-pattern'] as const;

const TASKS = SKILLS.flatMap(
  (skill) =>
    [
      {
        kind: 'trigger',
        set: 'regression',
        skill,
        taskKey: `${skill}/trigger`,
      },
      {
        kind: 'near-miss',
        set: 'regression',
        skill,
        taskKey: `${skill}/near-miss`,
      },
      {
        kind: 'trigger',
        set: 'capability',
        skill,
        taskKey: `${skill}/trigger-2`,
      },
    ] as const,
);

export const skillsRunFixture = ({
  base,
  branch = 'main',
  hidden = [],
  modelId = 'claude-opus-5-5',
  outcomesOf = () => ALL_PASS,
  runId,
}: SkillsRunFixtureArgs) => {
  const [subject] = base.subjects;
  const [task] = base.tasks;
  const [trial] = base.trials;

  if (subject === undefined || task === undefined || trial === undefined) {
    throw new Error('the skills fixture lost its subject, task or trial');
  }

  return runEnvelopeSchema.parse({
    ...base,
    run: {
      ...base.run,
      branch,
      model_id: modelId,
      run_id: runId,
      settings: { ...base.run.settings, hidden, selection: SKILLS },
    },
    subjects: SKILLS.map((name) => ({
      ...subject,
      content_hash: sha256Hex(name),
      name,
      path: `.github/skills/${name}`,
    })),
    tasks: TASKS.map(({ kind, set, skill, taskKey }) => ({
      ...task,
      kind,
      set,
      subject: { kind: 'skill', name: skill },
      task_hash: sha256Hex(taskKey),
      task_key: taskKey,
    })),
    trials: TASKS.flatMap(({ taskKey }) =>
      outcomesOf(taskKey).map((outcome, index) => ({
        ...trial,
        outcome,
        task_key: taskKey,
        trial_index: index,
      })),
    ),
  });
};
