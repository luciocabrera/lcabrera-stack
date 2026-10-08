import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { suiteRegressions } from './suiteRegressions.util';

const run = (overrides: Partial<RunFigures>) =>
  ({
    branch: 'main',
    runId: 'run',
    suite: 'skills',
    ...overrides,
  }) as RunFigures;

describe('suiteRegressions', () => {
  it('flags a suite whose latest main rate fell below the previous interval', () => {
    const latest = run({ lower: 0.3, rate: 0.5, runId: 'new' });
    const previous = run({ lower: 0.6, rate: 0.8, runId: 'old' });

    expect(suiteRegressions([latest, previous])).toEqual([
      { latest, previous, suite: 'skills' },
    ]);
  });

  it('ignores a drop that stays inside the previous interval', () => {
    expect(
      suiteRegressions([
        run({ lower: 0.5, rate: 0.7 }),
        run({ lower: 0.6, rate: 0.8 }),
      ]),
    ).toEqual([]);
  });

  it('compares main with main only', () => {
    expect(
      suiteRegressions([
        run({ branch: 'feature', lower: 0, rate: 0.1 }),
        run({ lower: 0.6, rate: 0.8 }),
      ]),
    ).toEqual([]);
  });

  it('judges nothing without a previous interval', () => {
    expect(
      suiteRegressions([
        run({ rate: 0.1 }),
        run({ lower: undefined, rate: 0.9 }),
      ]),
    ).toEqual([]);
  });
});
