import { describe, expect, it } from 'vite-plus/test';

import type { TaskTrials } from './stats.types.ts';

import { pooledRate } from './pooledRate.util.ts';

const config = { minTrialsForRate: 6, z: 1.96 };
const tasks: readonly TaskTrials[] = [
  { outcomes: ['pass', 'fail', 'pass'], set: 'regression', taskKey: 'a' },
  {
    outcomes: ['pass', 'error', 'pass', 'pass'],
    set: 'regression',
    taskKey: 'b',
  },
];

describe('pooledRate', () => {
  it('pools every task’s counted trials into one Wilson rate', () => {
    expect(pooledRate({ config, tasks })).toMatchObject({
      k: 5,
      kind: 'rate',
      n: 6,
    });
  });

  it('returns insufficient when the pool is below the trial floor', () => {
    expect(pooledRate({ config, tasks: tasks.slice(0, 1) })).toEqual({
      k: 2,
      kind: 'insufficient',
      n: 3,
    });
  });
});
