import { describe, expect, it } from 'vite-plus/test';

import { recordGradesQuery } from './recordGradesQuery.util.ts';

describe('recordGradesQuery', () => {
  it('writes every score in one statement, binding each value', () => {
    const query = recordGradesQuery({
      grader: 'lucio',
      scores: [
        { dimension: 'clarity', score: 4 },
        { dimension: 'anti_patterns', score: 2 },
      ],
      trialId: '42',
    });

    expect(query.text).toMatch(/^insert into evals\.eval_human_grade /u);
    expect(query.values).toEqual([
      '42',
      'lucio',
      ['clarity', 'anti_patterns'],
      [4, 2],
    ]);
  });

  it("replaces the same grader's earlier score for a dimension", () => {
    expect(recordGradesQuery({ grader: 'g', scores: [], trialId: '1' }).text)
      .toContain(`on conflict (trial_id, dimension, grader)
do update set score = excluded.score`);
  });
});
