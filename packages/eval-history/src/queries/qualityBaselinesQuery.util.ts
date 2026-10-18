import { projectedRelation } from './projectedRelation.util.ts';

type QualityBaselinesQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
};

export const qualityBaselinesQuery = ({
  publicColumns,
}: QualityBaselinesQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });

  return {
    text: `with latest as (
  select distinct on (baseline.subject_id)
    baseline.baseline_id,
    baseline.subject_id,
    baseline.model_id
  from ${relation({ columns: ['id', 'baseline_id', 'suite', 'subject_id', 'metric', 'model_id', 'computed_at'], table: 'eval_baseline' })} baseline
  where baseline.suite = 'skill-quality'
    and baseline.metric = 'quality_overall'
    and baseline.subject_id is not null
  order by baseline.subject_id, baseline.computed_at desc, baseline.id desc
)
select
  subject.kind::text as "subjectKind",
  subject.name as "subjectName",
  latest.baseline_id::text as "baselineId",
  latest.model_id as "modelId",
  coalesce(
    array_agg(run.run_id::text order by run.started_at, run.run_id) filter (where run.run_id is not null),
    '{}'
  ) as "runIds"
from latest
join ${relation({ columns: ['id', 'kind', 'name'], table: 'eval_subject' })} subject on subject.id = latest.subject_id
left join ${relation({ columns: ['run_id', 'suite', 'baseline_id', 'started_at'], table: 'eval_run' })} run
  on run.baseline_id = latest.baseline_id and run.suite = 'skill-quality'
group by subject.kind, subject.name, latest.baseline_id, latest.model_id
order by subject.kind, subject.name`,
    values: [],
  };
};
