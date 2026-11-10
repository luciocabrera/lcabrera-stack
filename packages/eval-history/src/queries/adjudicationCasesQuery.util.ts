import { projectedRelation } from './projectedRelation.util.ts';

type AdjudicationCasesQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
};

export const adjudicationCasesQuery = ({
  publicColumns,
}: AdjudicationCasesQueryArgs) => ({
  text: `select
  adjudication.case_id as "caseId",
  adjudication.analyzer,
  adjudication.rule,
  adjudication.outcome::text as outcome,
  adjudication.pr,
  adjudication.builder_model as "builderModel",
  adjudication.created_at as "createdAt",
  latest.truth::text as truth,
  latest.source::text as "truthSource"
from ${projectedRelation({ columns: ['case_id', 'analyzer', 'rule', 'outcome', 'pr', 'builder_model', 'created_at'], publicColumns, table: 'adjudication_case' })} adjudication
left join lateral (
  select ground_truth.truth, ground_truth.source
  from ${projectedRelation({ columns: ['id', 'case_id', 'truth', 'source', 'recorded_at'], publicColumns, table: 'adjudication_ground_truth' })} ground_truth
  where ground_truth.case_id = adjudication.case_id
  order by ground_truth.recorded_at desc, ground_truth.id desc
  limit 1
) latest on true
order by adjudication.created_at desc, adjudication.case_id desc`,
  values: [],
});
