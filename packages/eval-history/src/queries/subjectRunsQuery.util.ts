import { projectedRelation } from './projectedRelation.util.ts';

type SubjectRunsQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly scope:
    | {
        readonly kind: 'recent';
        readonly perSuite: number;
      }
    | {
        readonly kind: 'subject';
        readonly perSuite: number;
        readonly subjectKind: string;
        readonly subjectName: string;
      };
};

export const subjectRunsQuery = ({
  publicColumns,
  scope,
}: SubjectRunsQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });
  const runs = relation({
    columns: ['run_id', 'suite', 'started_at', 'model_id'],
    table: 'eval_run',
  });
  const scopedRuns =
    scope.kind === 'recent'
      ? `select ranked.* from (
    select run.*, row_number() over (partition by run.suite order by run.started_at desc, run.run_id) as recency
    from ${runs} run
  ) ranked
  where ranked.recency <= $1`
      : `select run.* from ${runs} run`;
  const subjectFilter =
    scope.kind === 'subject'
      ? '\nwhere subject.kind::text = $1 and subject.name = $2'
      : '';
  const latestPerSuite =
    scope.kind === 'subject'
      ? '\nwhere grouped."suiteRecency" <= $3\norder by grouped.suite, grouped."startedAt" desc, grouped."runId"'
      : '\norder by grouped."subjectKind", grouped."subjectName", grouped."startedAt" desc, grouped."runId"';

  return {
    text: `with run as (
  ${scopedRuns}
),
grouped as (
select
  subject.kind::text as "subjectKind",
  subject.name as "subjectName",
  run.run_id as "runId",
  run.suite,
  run.started_at as "startedAt",
  run.model_id as "modelId",
  array_agg(distinct subject_version.content_hash::text order by subject_version.content_hash::text) as "contentHashes",
  (count(*) filter (where trial.outcome in ('pass', 'fail')))::integer as n,
  (count(*) filter (where trial.outcome = 'pass'))::integer as k,
  count(*)::integer as trials,
  coalesce(
    min(trial.id) filter (where trial.outcome = 'fail'),
    min(trial.id) filter (where trial.outcome <> 'pass'),
    min(trial.id)
  )::text as "trialId",
  array_agg(distinct task.task_key order by task.task_key) as "taskKeys",
  row_number() over (partition by subject.id, run.suite order by run.started_at desc, run.run_id) as "suiteRecency"
from run
join ${relation({ columns: ['id', 'run_id', 'task_version_id', 'subject_version_id', 'outcome'], table: 'eval_trial' })} trial on trial.run_id = run.run_id
join ${relation({ columns: ['id', 'subject_id', 'content_hash'], table: 'eval_subject_version' })} subject_version on subject_version.id = trial.subject_version_id
join ${relation({ columns: ['id', 'kind', 'name'], table: 'eval_subject' })} subject on subject.id = subject_version.subject_id
join ${relation({ columns: ['id', 'task_id'], table: 'eval_task_version' })} task_version on task_version.id = trial.task_version_id
join ${relation({ columns: ['id', 'task_key'], table: 'eval_task' })} task on task.id = task_version.task_id${subjectFilter}
group by subject.id, subject.kind, subject.name, run.run_id, run.suite, run.started_at, run.model_id
)
select grouped.* from grouped${latestPerSuite}`,
    values:
      scope.kind === 'recent'
        ? [scope.perSuite]
        : [scope.subjectKind, scope.subjectName, scope.perSuite],
  };
};
