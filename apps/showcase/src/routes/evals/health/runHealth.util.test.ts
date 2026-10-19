import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { runHealth } from './runHealth.util';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';
const RUN_C = '00000000-0000-4000-8000-00000000000c';

type RunArgs = {
  readonly runId: string;
  readonly suite?: string;
};

const run = ({ runId, suite = 'skills' }: RunArgs) =>
  ({
    branch: 'main',
    runId,
    startedAt: '2026-10-01T02:00:00.000Z',
    suite,
    trials: 10,
  }) as RunFigures;

describe('runHealth', () => {
  const [skills, quality] = runHealth({
    counts: [
      { errorClass: 'rate_limit', outcome: 'error', runId: RUN_B, trials: 3 },
      { errorClass: 'execution', outcome: 'error', runId: RUN_B, trials: 1 },
      {
        errorClass: 'session_limit',
        outcome: 'error',
        runId: RUN_A,
        trials: 2,
      },
      { errorClass: undefined, outcome: 'timeout', runId: RUN_A, trials: 1 },
    ],
    runs: [
      run({ runId: RUN_B }),
      run({ runId: RUN_A }),
      run({ runId: RUN_C, suite: 'skill-quality' }),
    ],
  });

  it('counts errors, timeouts and rate limits per suite', () => {
    expect(skills?.totals).toEqual({
      errors: 6,
      rateLimits: 5,
      timeouts: 1,
      trials: 20,
    });
    expect(quality).toMatchObject({
      classes: [],
      runs: 1,
      totals: { errors: 0, rateLimits: 0, timeouts: 0, trials: 10 },
      troubled: [],
    });
  });

  it('counts each error class with the runs it hit, the largest first', () => {
    expect(
      skills?.classes.map(
        ({ errorClass, isRateLimit, outcome, runs, trials }) => [
          outcome,
          errorClass,
          trials,
          runs,
          isRateLimit,
        ],
      ),
    ).toEqual([
      ['error', 'rate_limit', 3, 1, true],
      ['error', 'session_limit', 2, 1, true],
      ['error', 'execution', 1, 1, false],
      ['timeout', 'unclassified', 1, 1, false],
    ]);
  });

  it('plots every run oldest first and lists the troubled ones newest first', () => {
    expect(
      skills?.points.map(({ key, tone, value }) => [key, value, tone]),
    ).toEqual([
      [RUN_A, 3, 'error'],
      [RUN_B, 4, 'error'],
    ]);
    expect(
      skills?.troubled.map(({ errors, rateLimits, runId, timeouts }) => [
        runId,
        errors,
        timeouts,
        rateLimits,
      ]),
    ).toEqual([
      [RUN_B, 4, 0, 3],
      [RUN_A, 2, 1, 2],
    ]);
  });
});
