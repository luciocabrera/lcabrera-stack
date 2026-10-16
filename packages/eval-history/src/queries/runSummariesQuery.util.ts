import { projectedRelation } from './projectedRelation.util.ts';

type RunSummariesQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly scope:
    | { readonly kind: 'recent'; readonly perSuite: number }
    | { readonly kind: 'run'; readonly runId: string };
};

const RUN_COLUMNS = [
  'run_id',
  'suite',
  'trigger',
  'branch',
  'git_sha',
  'git_dirty',
  'pr_number',
  'started_at',
  'finished_at',
  'status',
  'model_id',
  'harness_version',
  'sdk_version',
  'settings.runs',
  'settings.concurrency',
  'settings.timeout_ms',
  'settings.max_turns',
  'env.node',
  'env.os',
  'env.arch',
  'env.ci_runner',
];

const TRIAL_COLUMNS = ['run_id', 'outcome', 'cost_usd_reported'];

export const runSummariesQuery = ({
  publicColumns,
  scope,
}: RunSummariesQueryArgs) => {
  const run = projectedRelation({
    columns: RUN_COLUMNS,
    publicColumns,
    table: 'eval_run',
  });
  const trial = projectedRelation({
    columns: TRIAL_COLUMNS,
    publicColumns,
    table: 'eval_trial',
  });
  const scoped =
    scope.kind === 'run'
      ? `select run.*, 1 as recency from ${run} run where run.run_id = $1`
      : `select ranked.* from (
    select run.*, row_number() over (partition by run.suite order by run.started_at desc, run.run_id) as recency
    from ${run} run
  ) ranked
  where ranked.recency <= $1`;

  return {
    text: `with run as (
  ${scoped}
),
trials as (
  select
    trial.run_id,
    (count(*) filter (where trial.outcome in ('pass', 'fail')))::integer as n,
    (count(*) filter (where trial.outcome = 'pass'))::integer as k,
    count(*)::integer as trials,
    sum(trial.cost_usd_reported)::double precision as cost_usd
  from ${trial} trial
  where trial.run_id in (select run.run_id from run)
  group by trial.run_id
)
select
  run.run_id as "runId",
  run.suite,
  run.trigger,
  run.branch,
  run.git_sha as "gitSha",
  run.git_dirty as "gitDirty",
  run.pr_number as "prNumber",
  run.started_at as "startedAt",
  run.finished_at as "finishedAt",
  run.status,
  run.model_id as "modelId",
  run.harness_version as "harnessVersion",
  run.sdk_version as "sdkVersion",
  run.settings_runs as "runs",
  run.settings_concurrency as "concurrency",
  run.settings_timeout_ms as "timeoutMs",
  run.settings_max_turns as "maxTurns",
  run.env_node as "node",
  run.env_os as "os",
  run.env_arch as "arch",
  run.env_ci_runner as "ciRunner",
  coalesce(trials.n, 0) as n,
  coalesce(trials.k, 0) as k,
  coalesce(trials.trials, 0) as trials,
  trials.cost_usd as "costUsd"
from run
left join trials on trials.run_id = run.run_id
order by run.suite, run.started_at desc, run.run_id`,
    values: [scope.kind === 'run' ? scope.runId : scope.perSuite],
  };
};
