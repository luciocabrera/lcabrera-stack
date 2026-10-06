import { describe, expect, it } from 'vite-plus/test';

import type { Outcome } from './stats.types.ts';

import { flakyTasks } from './flakyTasks.util.ts';

type RunsArgs = {
  readonly disagreeing: number;
  readonly total: number;
};

const agree: readonly Outcome[] = ['pass', 'pass', 'pass'];
const disagree: readonly Outcome[] = ['pass', 'fail', 'pass'];
const config = { disagreeFraction: 0.2, window: 10 };
const runs = ({ disagreeing, total }: RunsArgs) =>
  Array.from({ length: total }, (_, index) =>
    index < disagreeing ? disagree : agree,
  );

describe('flakyTasks', () => {
  it('marks a task whose runs disagree in more than the fraction of the window', () => {
    expect(
      flakyTasks({
        config,
        history: [{ runs: runs({ disagreeing: 3, total: 10 }), taskKey: 'a' }],
      }),
    ).toEqual([{ disagreeing: 3, runs: 10, taskKey: 'a' }]);
  });

  it('does not mark a task at exactly the fraction', () => {
    expect(
      flakyTasks({
        config,
        history: [{ runs: runs({ disagreeing: 2, total: 10 }), taskKey: 'a' }],
      }),
    ).toEqual([]);
  });

  it('only reads the last window runs', () => {
    expect(
      flakyTasks({
        config,
        history: [{ runs: runs({ disagreeing: 5, total: 15 }), taskKey: 'a' }],
      }),
    ).toEqual([]);
  });

  it('does not count errors as disagreement', () => {
    expect(
      flakyTasks({
        config,
        history: [
          {
            runs: [
              ['pass', 'error', 'pass'],
              ['fail', 'timeout'],
            ],
            taskKey: 'a',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('moves with the configured fraction', () => {
    expect(
      flakyTasks({
        config: { ...config, disagreeFraction: 0.1 },
        history: [{ runs: runs({ disagreeing: 2, total: 10 }), taskKey: 'a' }],
      }),
    ).toHaveLength(1);
  });
});
