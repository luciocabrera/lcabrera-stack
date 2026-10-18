import { describe, expect, it } from 'vite-plus/test';

import { taskTrialsQuery } from './taskTrialsQuery.util.ts';

const publicColumns = new Set([
  'eval_run.harness_version',
  'eval_run.model_id',
  'eval_run.run_id',
  'eval_task.id',
  'eval_task.suite',
  'eval_task.task_key',
  'eval_task.task_set',
  'eval_task_version.id',
  'eval_task_version.task_id',
  'eval_trial.id',
  'eval_trial.outcome',
  'eval_trial.run_id',
  'eval_trial.task_version_id',
  'eval_trial.trial_index',
]);

const RUNS = ['00000000-0000-4000-8000-000000000001'];

describe('taskTrialsQuery', () => {
  it("collects each task's outcomes per run in trial order", () => {
    const { text, values } = taskTrialsQuery({ publicColumns, runIds: RUNS });

    expect(values).toEqual([RUNS]);
    expect(text).toContain('where trial.run_id = any($1::uuid[])\n');
    expect(text).toContain(
      'array_agg(trial.outcome::text order by trial.trial_index, trial.id)',
    );
  });

  it("carries each run's model and harness, which a regression verdict compares", () => {
    const { text } = taskTrialsQuery({ publicColumns, runIds: RUNS });

    expect(text).toContain('run.model_id as "modelId"');
    expect(text).toContain('run.harness_version as "harnessVersion"');
  });

  it('narrows to the named tasks', () => {
    const { text, values } = taskTrialsQuery({
      publicColumns,
      runIds: RUNS,
      taskKeys: ['t1'],
    });

    expect(values).toEqual([RUNS, ['t1']]);
    expect(text).toContain('and task.task_key = any($2::text[])');
  });

  it('stops at a task set that is no longer public', () => {
    const withoutSet = new Set(
      [...publicColumns].filter((column) => column !== 'eval_task.task_set'),
    );

    expect(() =>
      taskTrialsQuery({ publicColumns: withoutSet, runIds: RUNS }),
    ).toThrow(/task_set is not on the public allow-list/u);
  });
});
