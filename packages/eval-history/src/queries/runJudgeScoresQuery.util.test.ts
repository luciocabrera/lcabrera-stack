import { describe, expect, it } from 'vite-plus/test';

import { runJudgeScoresQuery } from './runJudgeScoresQuery.util.ts';

const publicColumns = new Set([
  'eval_judge_score.dimension',
  'eval_judge_score.score',
  'eval_judge_score.trial_id',
  'eval_trial.id',
  'eval_trial.run_id',
]);

describe('runJudgeScoresQuery', () => {
  it('reads the judge scores of one run through the projection', () => {
    const query = runJudgeScoresQuery({ publicColumns, runId: 'run-a' });

    expect(query.values).toEqual(['run-a']);
    expect(query.text).toContain(
      '(select trial_id, dimension, score from evals.eval_judge_score) score',
    );
    expect(query.text).toContain('where trial.run_id = $1');
  });

  it('refuses a column the allow-list leaves out', () => {
    expect(() =>
      runJudgeScoresQuery({
        publicColumns: new Set(['eval_trial.id', 'eval_trial.run_id']),
        runId: 'run-a',
      }),
    ).toThrow(/eval_judge_score\.trial_id is not on the public allow-list/u);
  });
});
