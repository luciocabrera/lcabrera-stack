type TaskPassRatesQueryArgs = {
  readonly runId: string;
};

export const taskPassRatesQuery = ({ runId }: TaskPassRatesQueryArgs) => ({
  text: `select
  run_id as "runId",
  suite,
  started_at as "startedAt",
  model_id as "modelId",
  task_key as "taskKey",
  kind,
  task_set as "taskSet",
  task_hash as "taskHash",
  n,
  k,
  pass_at_k as "passAtK",
  pass_hat_k as "passHatK"
from evals.v_task_pass_rate
where run_id = $1
order by task_key`,
  values: [runId],
});
