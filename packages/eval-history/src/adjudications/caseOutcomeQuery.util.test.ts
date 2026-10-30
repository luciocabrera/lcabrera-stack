import { describe, expect, it } from 'vite-plus/test';

import { caseOutcomeQuery } from './caseOutcomeQuery.util.ts';

describe('caseOutcomeQuery', () => {
  it('reads the stored outcome of one case by its id', () => {
    const { text, values } = caseOutcomeQuery('FP-0012');

    expect(text).toContain('from evals.adjudication_case');
    expect(text).toContain('where case_id = $1');
    expect(values).toEqual(['FP-0012']);
  });
});
