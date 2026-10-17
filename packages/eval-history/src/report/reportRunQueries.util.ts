export const reportRunQueries = (runId: string) => ({
  run: {
    text: `select
  run.run_id::text as "runId",
  run.suite,
  run.branch,
  run.git_sha::text as "gitSha",
  run.model_id as "modelId",
  run.harness_version as "harnessVersion",
  run.catalog_hash::text as "catalogHash",
  run.status::text as status,
  (run.totals ->> 'cost_usd_reported')::double precision as "costUsdReported",
  coalesce(
    (
      select array_agg(trial.duration_ms order by trial.duration_ms)
      from evals.eval_trial trial
      where trial.run_id = run.run_id and trial.duration_ms is not null
    ),
    '{}'
  ) as "durationsMs"
from evals.eval_run run
where run.run_id = $1`,
    values: [runId],
  },
  subjects: {
    text: `select distinct
  subject.kind::text as kind,
  subject.name,
  subject_version.content_hash::text as "contentHash"
from evals.eval_trial trial
join evals.eval_subject_version subject_version on subject_version.id = trial.subject_version_id
join evals.eval_subject subject on subject.id = subject_version.subject_id
where trial.run_id = $1
order by kind, subject.name`,
    values: [runId],
  },
  tasks: {
    text: `select
  task.task_key as "taskKey",
  array_agg(trial.outcome::text order by trial.trial_index) as outcomes,
  task_version.task_hash::text as "taskHash",
  task_version.fixture_hash::text as "fixtureHash",
  task_version.expected_hash::text as "expectedHash",
  task_version.judge_prompt_hash::text as "judgePromptHash",
  task_version.agent_prompt_hash::text as "agentPromptHash"
from evals.eval_trial trial
join evals.eval_task_version task_version on task_version.id = trial.task_version_id
join evals.eval_task task on task.id = task_version.task_id
where trial.run_id = $1
group by task.id, task.task_key, task_version.id
order by task.task_key`,
    values: [runId],
  },
});
