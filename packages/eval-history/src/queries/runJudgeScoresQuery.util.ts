import { projectedRelation } from './projectedRelation.util.ts';

type RunJudgeScoresQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly runId: string;
};

export const runJudgeScoresQuery = ({
  publicColumns,
  runId,
}: RunJudgeScoresQueryArgs) => ({
  text: `select
  score.trial_id::text as "trialId",
  score.dimension,
  score.score
from ${projectedRelation({ columns: ['trial_id', 'dimension', 'score'], publicColumns, table: 'eval_judge_score' })} score
join ${projectedRelation({ columns: ['id', 'run_id'], publicColumns, table: 'eval_trial' })} trial on trial.id = score.trial_id
where trial.run_id = $1
order by score.trial_id, score.dimension`,
  values: [runId],
});
