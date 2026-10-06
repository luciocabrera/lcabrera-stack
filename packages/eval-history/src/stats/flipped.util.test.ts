import { describe, expect, it } from 'vite-plus/test';

import type { Outcome, TaskTrials } from './stats.types.ts';

import { flipped } from './flipped.util.ts';

const flip = { failAtLeast: 2, ofTrials: 3 };
const task = (outcomes: readonly Outcome[]): TaskTrials => ({
  outcomes,
  set: 'regression',
  taskKey: 'a/trigger',
});
const main = [task(['pass', 'pass', 'pass'])];

describe('flipped', () => {
  it('flags a task that passed on main and failed 2 of 3 on the PR', () => {
    expect(flipped({ flip, main, pr: task(['fail', 'pass', 'fail']) })).toEqual(
      {
        failed: 2,
        kind: 'flip',
        taskKey: 'a/trigger',
        trials: 3,
      },
    );
  });

  it('does not flag 1 failure in 3', () => {
    expect(
      flipped({ flip, main, pr: task(['fail', 'pass', 'pass']) }),
    ).toBeUndefined();
  });

  it('does not flag a task that was not passing on main', () => {
    expect(
      flipped({
        flip,
        main: [task(['pass', 'fail', 'pass'])],
        pr: task(['fail', 'fail', 'fail']),
      }),
    ).toBeUndefined();
    expect(
      flipped({ flip, main: [], pr: task(['fail', 'fail', 'fail']) }),
    ).toBeUndefined();
  });

  it('does not count errors as failures or as trials', () => {
    expect(
      flipped({ flip, main, pr: task(['fail', 'error', 'fail']) }),
    ).toBeUndefined();
  });

  it('scales the threshold to the number of counted trials', () => {
    expect(
      flipped({
        flip,
        main,
        pr: task(['fail', 'fail', 'fail', 'pass', 'pass', 'pass']),
      }),
    ).toBeUndefined();
    expect(
      flipped({
        flip,
        main,
        pr: task(['fail', 'fail', 'fail', 'fail', 'pass', 'pass']),
      }),
    ).toMatchObject({ failed: 4, trials: 6 });
  });
});
