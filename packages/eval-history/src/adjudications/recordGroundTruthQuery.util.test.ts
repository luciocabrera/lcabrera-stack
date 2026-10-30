import { describe, expect, it } from 'vite-plus/test';

import { recordGroundTruthQuery } from './recordGroundTruthQuery.util.ts';

describe('recordGroundTruthQuery', () => {
  it('appends one true answer for the case, with its source and note', () => {
    const { text, values } = recordGroundTruthQuery({
      caseId: 'FP-0007',
      note: 'reopened by the gate',
      source: 'reopened',
      truth: 'REAL',
    });

    expect(text).toContain('insert into evals.adjudication_ground_truth');
    expect(text).not.toContain('on conflict');
    expect(values).toEqual([
      'FP-0007',
      'REAL',
      'reopened',
      'reopened by the gate',
    ]);
  });

  it('sends no note as undefined, which the driver stores as null', () => {
    expect(
      recordGroundTruthQuery({
        caseId: 'FP-0007',
        note: undefined,
        source: 'lucio',
        truth: 'FALSE_POSITIVE',
      }).values.at(-1),
    ).toBeUndefined();
  });
});
