import { DETAIL_SCHEMA_BY_SUITE } from '../envelope/envelope.constants.ts';

type JudgedDimensionsQueryArgs = {
  readonly trialId: string;
};

export const judgedDimensionsQuery = ({
  trialId,
}: JudgedDimensionsQueryArgs) => ({
  text: `select dimension.value ->> 'name' as name
from evals.eval_trial_detail trial_detail
cross join lateral jsonb_array_elements(trial_detail.detail -> 'dimensions') with ordinality as dimension (value, position)
where trial_detail.trial_id = $1 and trial_detail.detail_schema = $2
order by dimension.position`,
  values: [trialId, DETAIL_SCHEMA_BY_SUITE['skill-quality']],
});
