import { describe, expect, it } from 'vite-plus/test';

import { adjudicationAccuracyQuery } from './adjudicationAccuracyQuery.util.ts';

describe('adjudicationAccuracyQuery', () => {
  it('reads the counts per model and role from the accuracy view', () => {
    const { text, values } = adjudicationAccuracyQuery();

    expect(text).toContain('from evals.v_adjudication_accuracy');
    expect(text).toContain('order by model, verifier_role');
    expect(values).toEqual([]);
  });
});
