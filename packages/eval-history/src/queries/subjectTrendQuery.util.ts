type SubjectTrendQueryArgs = {
  readonly kind: string;
  readonly limit: number;
  readonly name: string;
};

export const subjectTrendQuery = ({
  kind,
  limit,
  name,
}: SubjectTrendQueryArgs) => ({
  text: `select
  subject_kind as "subjectKind",
  subject_name as "subjectName",
  run_id as "runId",
  suite,
  started_at as "startedAt",
  model_id as "modelId",
  content_hash as "contentHash",
  n,
  k
from evals.v_subject_trend
where subject_kind = $1 and subject_name = $2
order by started_at desc
limit $3`,
  values: [kind, name, limit],
});
