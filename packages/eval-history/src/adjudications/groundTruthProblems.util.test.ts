import { describe, expect, it } from 'vite-plus/test';

import { groundTruthProblems } from './groundTruthProblems.util.ts';

describe('groundTruthProblems', () => {
  it('names a case that is not stored', () => {
    expect(
      groundTruthProblems({
        caseId: 'FP-0001',
        outcome: undefined,
        source: 'lucio',
      }),
    ).toEqual([
      'case FP-0001 is not stored; ingest its envelope with vp run evals:ingest first',
    ]);
  });

  it.each(['fixed', 'split', 'escalated'])(
    'refuses to reopen a %s case',
    (outcome) => {
      expect(
        groundTruthProblems({ caseId: 'FP-0001', outcome, source: 'reopened' }),
      ).toEqual([
        `case FP-0001 was ${outcome}, not dismissed: only a dismissal is reopened`,
      ]);
    },
  );

  it.each([
    { outcome: 'dismissed', source: 'reopened' },
    { outcome: 'dismissed', source: 'lucio' },
    { outcome: 'split', source: 'lucio' },
    { outcome: 'fixed', source: 'upstream-fix' },
  ] as const)('accepts a $outcome case graded from $source', (graded) => {
    expect(groundTruthProblems({ caseId: 'FP-0001', ...graded })).toEqual([]);
  });
});
