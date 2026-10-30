import { describe, expect, it } from 'vite-plus/test';

import { adjudicationAccuracyLines } from './adjudicationAccuracyLines.util.ts';

const row = {
  correct: 8,
  falseAlarms: 1,
  missedReal: 1,
  model: 'claude-opus-5-5',
  verdicts: 10,
  verifierRole: 'judge',
} as const;

describe('adjudicationAccuracyLines', () => {
  it('says how to record a true answer when none is recorded', () => {
    expect(adjudicationAccuracyLines({ minN: 5, rows: [], z: 1.96 })).toEqual([
      'Adjudication accuracy: no true answers yet; record one with vp run evals:grade-adjudication -- <case_id> <REAL|FALSE_POSITIVE>',
    ]);
  });

  it('gives each model and role its accuracy with n and its Wilson interval', () => {
    expect(
      adjudicationAccuracyLines({ minN: 5, rows: [row], z: 1.96 }),
    ).toEqual([
      'Adjudication accuracy (claude-opus-5-5, judge): 80.0% (n=10 verdicts with a true answer, 8 correct; Wilson interval 49.0%–94.3% at z=1.96); 1 called FALSE_POSITIVE on a real problem, 1 called REAL on a false positive',
    ]);
  });

  it('says insufficient data below the floor, still naming the errors', () => {
    expect(
      adjudicationAccuracyLines({
        minN: 5,
        rows: [
          {
            ...row,
            correct: 1,
            falseAlarms: 0,
            missedReal: 1,
            verdicts: 2,
            verifierRole: 'adversary',
          },
        ],
        z: 1.96,
      }),
    ).toEqual([
      'Adjudication accuracy (claude-opus-5-5, adversary): insufficient data (n=2 verdicts with a true answer, 1 correct; a rate needs 5); 1 called FALSE_POSITIVE on a real problem, 0 called REAL on a false positive',
    ]);
  });
});
