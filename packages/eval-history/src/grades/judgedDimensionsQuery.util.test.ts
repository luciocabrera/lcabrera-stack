import { describe, expect, it } from 'vite-plus/test';

import { judgedDimensionsQuery } from './judgedDimensionsQuery.util.ts';

describe('judgedDimensionsQuery', () => {
  it("reads only the names of a trial's judged dimensions, not their scores", () => {
    const query = judgedDimensionsQuery({ trialId: '42' });

    expect(query.values).toEqual(['42']);
    expect(query.text).toContain('from evals.eval_judge_score');
    expect(query.text).not.toMatch(/\bscore\b|\bdetail\b/u);
  });
});
