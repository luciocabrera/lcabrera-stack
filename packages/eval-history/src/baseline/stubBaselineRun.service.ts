import { randomUUID } from 'node:crypto';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { Outcome } from '../stats/stats.types.ts';

type StubBaselineRunArgs = {
  readonly baselineId?: string;
  readonly fixture: RunEnvelope;
  readonly gitDirty?: boolean;
  readonly gitSha?: string;
  readonly modelId?: string;
  readonly status?: RunEnvelope['run']['status'];
  readonly trialsBySkill: Readonly<Record<string, readonly StubTrial[]>>;
};

type StubTrial = {
  readonly outcome: Outcome;
  readonly overall?: number;
};

type StubTrialArgs = {
  readonly index: number;
  readonly skill: string;
  readonly stub: StubTrial;
  readonly template: Trial;
};

type Trial = RunEnvelope['trials'][number];

const STUB_SHA = 'a'.repeat(40);

const taskKeyOf = (skill: string) => `stub/${skill}`;

const stubTrial = ({
  index,
  skill,
  stub: { outcome, overall },
  template,
}: StubTrialArgs): Trial => ({
  ...template,
  detail:
    overall !== undefined && template.detail.schema === 'quality/1'
      ? { ...template.detail, overall }
      : template.detail,
  error_class: outcome === 'error' ? 'harness' : template.error_class,
  outcome,
  task_key: taskKeyOf(skill),
  trial_index: index,
});

const baselineFields = (baselineId: string | undefined) =>
  baselineId === undefined
    ? {}
    : ({ baseline_id: baselineId, trigger: 'baseline' } as const);

export const stubBaselineRun = ({
  baselineId,
  fixture,
  gitDirty = false,
  gitSha = STUB_SHA,
  modelId,
  status = 'complete',
  trialsBySkill,
}: StubBaselineRunArgs): RunEnvelope => {
  const [subject] = fixture.subjects;
  const [task] = fixture.tasks;
  const [template] = fixture.trials;

  if (!subject || !task || !template) {
    throw new Error(
      `the ${fixture.run.suite} fixture lacks a subject, task or trial`,
    );
  }

  const skills = Object.keys(trialsBySkill);

  return {
    ...fixture,
    run: {
      ...fixture.run,
      ...baselineFields(baselineId),
      git_dirty: gitDirty,
      git_sha: gitSha,
      model_id: modelId ?? fixture.run.model_id,
      run_id: randomUUID(),
      status,
    },
    subjects: skills.map((name) => ({ ...subject, name })),
    tasks: skills.map((name) => ({
      ...task,
      subject: { kind: 'skill', name },
      task_key: taskKeyOf(name),
    })),
    trials: skills.flatMap((skill) =>
      (trialsBySkill[skill] ?? []).map((stub, index) =>
        stubTrial({ index, skill, stub, template }),
      ),
    ),
  };
};
