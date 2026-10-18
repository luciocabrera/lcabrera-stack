import { describe, expect, it } from 'vite-plus/test';

import { qualityScoresQuery } from './qualityScoresQuery.util.ts';

const publicColumns = new Set([
  'eval_judge_score.dimension',
  'eval_judge_score.score',
  'eval_judge_score.trial_id',
  'eval_subject.id',
  'eval_subject.kind',
  'eval_subject.name',
  'eval_subject_version.id',
  'eval_subject_version.subject_id',
  'eval_trial.id',
  'eval_trial.run_id',
  'eval_trial.subject_version_id',
]);

const RUNS = ['00000000-0000-4000-8000-000000000001'];

describe('qualityScoresQuery', () => {
  const { text, values } = qualityScoresQuery({ publicColumns, runIds: RUNS });

  it('averages each dimension per run and subject', () => {
    expect(values).toEqual([RUNS]);
    expect(text).toContain('avg(score.score)::double precision as mean');
    expect(text).toContain(
      'group by trial.run_id, subject.id, subject.kind, subject.name, score.dimension',
    );
  });
});
