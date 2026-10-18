import { projectedRelation } from './projectedRelation.util.ts';

type TaskTrialsQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly runIds: readonly string[];
  readonly taskKeys?: readonly string[];
};

export const taskTrialsQuery = ({
  publicColumns,
  runIds,
  taskKeys,
}: TaskTrialsQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });
  const taskFilter =
    taskKeys === undefined ? '' : '\n  and task.task_key = any($2::text[])';

  return {
    text: `select
  trial.run_id::text as "runId",
  run.model_id as "modelId",
  run.harness_version as "harnessVersion",
  task.suite,
  task.task_key as "taskKey",
  task.task_set::text as "taskSet",
  array_agg(trial.outcome::text order by trial.trial_index, trial.id) as outcomes
from ${relation({ columns: ['id', 'run_id', 'task_version_id', 'trial_index', 'outcome'], table: 'eval_trial' })} trial
join ${relation({ columns: ['run_id', 'model_id', 'harness_version'], table: 'eval_run' })} run on run.run_id = trial.run_id
join ${relation({ columns: ['id', 'task_id'], table: 'eval_task_version' })} task_version on task_version.id = trial.task_version_id
join ${relation({ columns: ['id', 'suite', 'task_key', 'task_set'], table: 'eval_task' })} task on task.id = task_version.task_id
where trial.run_id = any($1::uuid[])${taskFilter}
group by trial.run_id, run.model_id, run.harness_version, task.id, task.suite, task.task_key, task.task_set
order by trial.run_id, task.task_key`,
    values:
      taskKeys === undefined ? [[...runIds]] : [[...runIds], [...taskKeys]],
  };
};
