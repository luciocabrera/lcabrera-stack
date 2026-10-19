import { describe, expect, it } from 'vite-plus/test';

import { leftOutFlaky } from './leftOutFlaky.util';

describe('leftOutFlaky', () => {
  it("keeps each left-out task's key and how many of its runs split", () => {
    expect(
      leftOutFlaky({
        flaky: [
          {
            a: { excluded: 0, k: 3, n: 3 },
            b: { excluded: 0, k: 1, n: 3 },
            disagreeing: 2,
            runs: 4,
            taskKey: 't1',
          },
        ],
      }),
    ).toEqual([{ disagreeing: 2, runs: 4, taskKey: 't1' }]);
  });

  it('lists nothing when the rule read no history', () => {
    expect(leftOutFlaky({ flaky: [] })).toEqual([]);
  });
});
