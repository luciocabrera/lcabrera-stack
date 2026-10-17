import { describe, expect, it } from 'vite-plus/test';

import { missingRunsProblem } from './missingRunsProblem.util.ts';

const BASELINE = '11111111-1111-4111-8111-111111111111';

describe('missingRunsProblem', () => {
  it('passes when every commissioned run is accounted for', () => {
    expect(
      missingRunsProblem({
        baselineId: BASELINE,
        found: 3,
        paths: ['/results/skills'],
        runs: 3,
      }),
    ).toBeUndefined();
  });

  it('counts the runs that left no envelope', () => {
    expect(
      missingRunsProblem({
        baselineId: BASELINE,
        found: 1,
        paths: ['/results/skills'],
        runs: 3,
      }),
    ).toBe(
      `2 of 3 runs left no envelope for baseline ${BASELINE} under /results/skills, so a runner failed before recording`,
    );
  });
});
