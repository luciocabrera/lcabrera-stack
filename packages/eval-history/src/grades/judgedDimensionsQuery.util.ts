type JudgedDimensionsQueryArgs = {
  readonly trialId: string;
};

export const judgedDimensionsQuery = ({
  trialId,
}: JudgedDimensionsQueryArgs) => ({
  text: `select dimension as name
from evals.eval_judge_score
where trial_id = $1
order by dimension`,
  values: [trialId],
});
