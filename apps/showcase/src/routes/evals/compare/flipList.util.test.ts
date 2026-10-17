import { describe, expect, it } from 'vite-plus/test';

import { comparisonRow } from './comparisonRow.fixtures';
import { flipList } from './flipList.util';

const row = comparisonRow;

describe('flipList', () => {
  it('leaves out a task whose verdict held', () => {
    expect(
      flipList([row({}), row({ kA: 1, kB: 2, taskKey: 'mixed' })]),
    ).toEqual([]);
  });

  it('lists regressions first, then improvements, then other changes', () => {
    const flips = flipList([
      row({
        kA: undefined,
        nA: undefined,
        outcomesA: undefined,
        taskKey: 'new',
      }),
      row({ kA: 0, taskKey: 'better' }),
      row({ kB: 1, taskKey: 'worse' }),
    ]);

    expect(flips.map(({ change, taskKey }) => [taskKey, change])).toEqual([
      ['worse', 'regressed'],
      ['better', 'improved'],
      ['new', 'changed'],
    ]);
  });

  it('shows each side as passes over scored trials', () => {
    const [flip] = flipList([
      row({ kB: 1, nB: 2, outcomesB: ['pass', 'fail', 'error'] }),
    ]);

    expect(flip).toMatchObject({ a: '3/3', b: '1/2, 1 not scored' });
  });
});
