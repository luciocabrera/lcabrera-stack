import type { RunTrial } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { trialChartPoints } from './trialChartPoints.util';

const trial = (overrides: Partial<RunTrial>) =>
  ({
    durationMs: 12_000,
    outcome: 'pass',
    taskKey: 'skills/react-19/trigger-1',
    trialId: '7',
    trialIndex: 0,
    ...overrides,
  }) as RunTrial;

describe('trialChartPoints', () => {
  it('links each trial to itself within its run', () => {
    expect(
      trialChartPoints({
        runId: 'run-a',
        trials: [trial({}), trial({ outcome: 'fail', trialId: '8' })],
      }),
    ).toEqual([
      {
        href: '/evals/runs/run-a?trial=7',
        key: '7',
        label: 'skills/react-19/trigger-1 trial 0: pass, 12s',
        tone: 'success',
        value: 12_000,
      },
      {
        href: '/evals/runs/run-a?trial=8',
        key: '8',
        label: 'skills/react-19/trigger-1 trial 0: fail, 12s',
        tone: 'error',
        value: 12_000,
      },
    ]);
  });

  it('plots a trial without a duration at zero, in a neutral tone', () => {
    expect(
      trialChartPoints({
        runId: 'run-a',
        trials: [trial({ durationMs: undefined, outcome: 'error' })],
      })[0],
    ).toMatchObject({
      label: 'skills/react-19/trigger-1 trial 0: error, no duration',
      tone: 'neutral',
      value: 0,
    });
  });
});
