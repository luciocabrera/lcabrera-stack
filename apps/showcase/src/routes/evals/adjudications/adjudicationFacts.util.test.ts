import { describe, expect, it } from 'vite-plus/test';

import { adjudicationFacts } from './adjudicationFacts.util';
import { adjudication, CASES, VERDICTS } from './adjudications.fixtures';

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

  it('counts as reopened only the dismissals a reopened answer turned', () => {
    const facts = adjudicationFacts({
      cases: [
        adjudication({
          caseId: 'FP-0010',
          truth: 'REAL',
          truthSource: 'reopened',
        }),
        adjudication({
          caseId: 'FP-0011',
          truth: 'REAL',
          truthSource: 'lucio',
        }),
        adjudication({
          caseId: 'FP-0012',
          truth: 'FALSE_POSITIVE',
          truthSource: 'lucio',
        }),
      ],
      verdicts: [],
    });

    expect(
      facts.find(({ term }) => term === 'Reopened dismissals')?.value,
    ).toBe('1');
  });

  it('counts nothing on an empty history', () => {
    expect(
      adjudicationFacts({ cases: [], verdicts: [] }).map(({ value }) => value),
    ).toEqual(['0', '0', '0', '0', '0', '0']);
  });
});
