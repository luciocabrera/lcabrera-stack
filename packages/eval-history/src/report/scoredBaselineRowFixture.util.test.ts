import { describe, expect, it } from 'vite-plus/test';

import { scoredBaselineRowFixture } from './scoredBaselineRowFixture.util.ts';

describe('scoredBaselineRowFixture', () => {
  it("is one skill's baseline row: mean 4, standard deviation 0.25, over 5 runs", () => {
    expect(scoredBaselineRowFixture('unslop')).toEqual({
      harnessVersion: 'h1',
      mean: 4,
      modelId: 'model-a',
      nRuns: 5,
      stddev: 0.25,
      subject: { kind: 'skill', name: 'unslop' },
    });
  });

  it('is the suite-wide row when given no skill', () => {
    expect(scoredBaselineRowFixture(undefined).subject).toBeUndefined();
  });
});
