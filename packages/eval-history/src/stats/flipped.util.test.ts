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

  it('flags a short task whose counted failures flip it whatever the missing trials were', () => {
    expect(
      flipped({ flip, main, pr: task(['fail', 'fail', 'error']) }),
    ).toEqual({ failed: 2, kind: 'flip', taskKey: 'a/trigger', trials: 2 });
    expect(
      flipped({ flip, main, pr: task(['fail', 'error', 'fail']) }),
    ).toEqual({ failed: 2, kind: 'flip', taskKey: 'a/trigger', trials: 2 });
  });

  it('reports a short task as insufficient when the missing trials decide it', () => {
    expect(
      flipped({ flip, main, pr: task(['fail', 'error', 'pass']) }),
    ).toEqual({
      failed: 1,
      kind: 'insufficient',
      taskKey: 'a/trigger',
      trials: 2,
    });
    expect(
      flipped({ flip, main, pr: task(['error', 'timeout', 'skipped']) }),
    ).toMatchObject({ kind: 'insufficient', trials: 0 });
  });

  it('stays silent on a short task the missing trials could not flip', () => {
    expect(
      flipped({ flip, main, pr: task(['pass', 'error', 'pass']) }),
    ).toBeUndefined();
  });

  it('does not report a short task that was not passing on main', () => {
    expect(
      flipped({ flip, main: [], pr: task(['fail', 'error', 'fail']) }),
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
