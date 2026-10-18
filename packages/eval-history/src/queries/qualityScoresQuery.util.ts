import { projectedRelation } from './projectedRelation.util.ts';

type QualityScoresQueryArgs = {
  readonly publicColumns: ReadonlySet<string>;
  readonly runIds: readonly string[];
};

export const qualityScoresQuery = ({
  publicColumns,
  runIds,
}: QualityScoresQueryArgs) => {
  const relation = (
    target: Omit<Parameters<typeof projectedRelation>[0], 'publicColumns'>,
  ) => projectedRelation({ ...target, publicColumns });

  return {
    text: `select
  trial.run_id::text as "runId",
  subject.kind::text as "subjectKind",
  subject.name as "subjectName",
  score.dimension,
  avg(score.score)::double precision as mean,
  count(*)::integer as trials
from ${relation({ columns: ['trial_id', 'dimension', 'score'], table: 'eval_judge_score' })} score
join ${relation({ columns: ['id', 'run_id', 'subject_version_id'], table: 'eval_trial' })} trial on trial.id = score.trial_id
join ${relation({ columns: ['id', 'subject_id'], table: 'eval_subject_version' })} subject_version on subject_version.id = trial.subject_version_id
join ${relation({ columns: ['id', 'kind', 'name'], table: 'eval_subject' })} subject on subject.id = subject_version.subject_id
where trial.run_id = any($1::uuid[])
group by trial.run_id, subject.id, subject.kind, subject.name, score.dimension
order by subject.kind, subject.name, score.dimension, trial.run_id`,
    values: [[...runIds]],
  };
};
