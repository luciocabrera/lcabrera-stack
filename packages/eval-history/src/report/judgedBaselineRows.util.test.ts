import { describe, expect, it } from 'vite-plus/test';

import { judgedBaselineRows } from './judgedBaselineRows.util.ts';
import { scoredBaselineRowFixture } from './scoredBaselineRowFixture.util.ts';

const baseline = [
  scoredBaselineRowFixture(undefined),
  scoredBaselineRowFixture('react-19'),
  scoredBaselineRowFixture('unslop'),
];

describe('judgedBaselineRows', () => {
  it('keeps the suite row and every subject row when the run holds every subject', () => {
    expect(
      judgedBaselineRows({
        baseline,
        subjects: new Set(['skill:react-19', 'skill:unslop']),
      }),
    ).toEqual(baseline);
  });

  it('keeps only the subjects the run holds, and drops the suite row then', () => {
    expect(
      judgedBaselineRows({ baseline, subjects: new Set(['skill:unslop']) }),
    ).toEqual([scoredBaselineRowFixture('unslop')]);
  });

  it('keeps nothing when the run and the baseline share no subject', () => {
    expect(
      judgedBaselineRows({ baseline, subjects: new Set(['skill:epic']) }),
    ).toEqual([]);
  });
});
