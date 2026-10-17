import type { HumanScore } from './grades.types.ts';

type RecordGradesQueryArgs = {
  readonly grader: string;
  readonly scores: readonly HumanScore[];
  readonly trialId: string;
};

export const recordGradesQuery = ({
  grader,
  scores,
  trialId,
}: RecordGradesQueryArgs) => ({
  text: `insert into evals.eval_human_grade (trial_id, dimension, score, grader)
select $1::bigint, graded.dimension, graded.score, $2::text
from unnest($3::text[], $4::smallint[]) as graded (dimension, score)
on conflict (trial_id, dimension, grader)
do update set score = excluded.score, graded_at = now()
returning dimension`,
  values: [
    trialId,
    grader,
    scores.map(({ dimension }) => dimension),
    scores.map(({ score }) => score),
  ],
});
