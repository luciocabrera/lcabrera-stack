import { describe, expect, it } from 'vite-plus/test';

import { triggerConfusionQuery } from './triggerConfusionQuery.util.ts';

const publicColumns = new Set([
  'eval_task.id',
  'eval_task.kind',
  'eval_task_version.id',
  'eval_task_version.task_id',
  'eval_trial.id',
  'eval_trial.outcome',
  'eval_trial.run_id',
  'eval_trial.task_version_id',
  'eval_trial_detail.trial_id',
]);

const RUNS = ['00000000-0000-4000-8000-000000000001'];

describe('triggerConfusionQuery', () => {
  const { text, values } = triggerConfusionQuery({
    publicColumns,
    runIds: RUNS,
  });

  it('counts the trigger and near-miss trials of the runs named, skipped ones aside', () => {
    expect(values).toEqual([RUNS]);
    expect(text).toContain("and task.kind in ('trigger', 'near-miss')");
    expect(text).toContain("and trial.outcome <> 'skipped'");
    expect(text).toContain("trial.outcome in ('error', 'timeout') as errored");
  });

  it('reads the expected and invoked skills from the public copy of the detail', () => {
    expect(text).toContain("detail_public -> 'expected_skill'");
    expect(text).toContain("detail_public -> 'invoked'");
  });
});
