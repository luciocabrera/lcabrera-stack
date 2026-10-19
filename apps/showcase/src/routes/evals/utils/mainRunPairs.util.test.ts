import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { mainRunPairs } from './mainRunPairs.util';

const run = (overrides: Partial<RunFigures>) =>
  ({
    branch: 'main',
    runId: 'run',
    suite: 'skills',
    ...overrides,
  }) as RunFigures;

describe('mainRunPairs', () => {
  it("pairs each suite's newest main run with the one before it", () => {
    const latest = run({ runId: 'new' });
    const previous = run({ runId: 'old' });

    expect(
      mainRunPairs([
        run({ branch: 'feature', runId: 'branch' }),
        latest,
        previous,
        run({ runId: 'older' }),
      ]),
    ).toEqual([{ latest, previous, suite: 'skills' }]);
  });

  it('pairs nothing for a suite with one main run', () => {
    expect(
      mainRunPairs([
        run({ runId: 'only' }),
        run({ suite: 'verifier-fixtures' }),
      ]),
    ).toEqual([]);
  });
});
