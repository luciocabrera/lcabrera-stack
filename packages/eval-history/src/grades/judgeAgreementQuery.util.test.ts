import { describe, expect, it } from 'vite-plus/test';

import { judgeAgreementQuery } from './judgeAgreementQuery.util.ts';

describe('judgeAgreementQuery', () => {
  it('reads both scores and the judge identity, and no grader or prose', () => {
    const { text, values } = judgeAgreementQuery();

    expect(text).toContain('from evals.v_judge_agreement');
    expect(text).not.toMatch(/grader|feedback|summary|detail\b/u);
    expect(values).toEqual([]);
  });
});
