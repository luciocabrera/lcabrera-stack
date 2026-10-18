import { describe, expect, it } from 'vite-plus/test';

import { flakyText } from './flakyText.util.ts';

const labels = { a: 'main', b: 'feat/x' };

describe('flakyText', () => {
  it('prints nothing when no task is flaky', () => {
    expect(flakyText({ flaky: [], labels })).toEqual([]);
  });

  it('lists each flaky task with its split on both sides', () => {
    expect(
      flakyText({
        flaky: [
          {
            a: { excluded: 0, k: 2, n: 3 },
            b: { excluded: 0, k: 1, n: 3 },
            disagreeing: 3,
            runs: 10,
            taskKey: 'epic/near-miss',
          },
        ],
        labels,
      }),
    ).toEqual([
      'Flaky, left out of the rule:\n- `epic/near-miss`: main 2/3, feat/x 1/3; its trials disagreed in 3 of its last 10 runs',
    ]);
  });
});
