import { projectedRelation } from './projectedRelation.util.ts';

type TriggerConfusionQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly runIds: readonly string[];
};

export const triggerConfusionQuery = ({
  publicColumns,
  runIds,
}: TriggerConfusionQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });

  return {
    text: `select
  task.kind::text as "taskKind",
  trial_detail.detail_expected_skill #>> '{}' as "expectedSkill",
  coalesce(trial_detail.detail_invoked, '[]'::jsonb) as invoked,
  trial.outcome in ('error', 'timeout') as errored,
  count(*)::integer as trials
from ${relation({ columns: ['id', 'run_id', 'task_version_id', 'outcome'], table: 'eval_trial' })} trial
join ${relation({ columns: ['id', 'task_id'], table: 'eval_task_version' })} task_version on task_version.id = trial.task_version_id
join ${relation({ columns: ['id', 'kind'], table: 'eval_task' })} task on task.id = task_version.task_id
join ${relation({ columns: ['trial_id', 'detail.expected_skill', 'detail.invoked'], table: 'eval_trial_detail' })} trial_detail on trial_detail.trial_id = trial.id
where trial.run_id = any($1::uuid[])
  and trial.outcome <> 'skipped'
  and task.kind in ('trigger', 'near-miss')
  and jsonb_typeof(trial_detail.detail_expected_skill) = 'string'
group by 1, 2, 3, 4
order by 2, 1, 4, 5 desc`,
    values: [[...runIds]],
  };
};
