import { describe, expect, it } from 'vite-plus/test';

import { adjudicationFacts } from './adjudicationFacts.util';
import { CASES, VERDICTS } from './adjudications.fixtures';

describe('adjudicationFacts', () => {
  it('counts the cases, their true answers, dismissals and lone adversary catches', () => {
    expect(adjudicationFacts({ cases: CASES, verdicts: VERDICTS })).toEqual([
      { term: 'Cases', value: '4' },
      { term: 'With a true answer', value: '3' },
      { term: 'Dismissed', value: '2' },
      { term: 'Reopened dismissals', value: '1' },
      { term: 'Only the adversary said REAL', value: '1' },
      { term: 'Of those, REAL by the true answer', value: '1' },
    ]);
  });

  it('counts nothing on an empty history', () => {
    expect(
      adjudicationFacts({ cases: [], verdicts: [] }).map(({ value }) => value),
    ).toEqual(['0', '0', '0', '0', '0', '0']);
  });
});
