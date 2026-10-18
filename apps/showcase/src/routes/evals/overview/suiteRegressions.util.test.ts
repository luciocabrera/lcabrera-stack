import { describe, expect, it } from 'vite-plus/test';

import type { TaskTrialsRow } from '../types/historyRows.types';
import type { RunFigures } from '../types/runFigures.types';
import type { MainRunPair } from './EvalsOverview.types';

import { suiteRegressions } from './suiteRegressions.util';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

const run = (runId: string) =>
  ({ branch: 'main', runId, suite: 'skills' }) as RunFigures;

const PAIR: MainRunPair = {
  latest: run(RUN_B),
  previous: run(RUN_A),
  suite: 'skills',
};

type TaskArgs = Partial<Pick<TaskTrialsRow, 'modelId'>> &
  Pick<TaskTrialsRow, 'outcomes' | 'runId' | 'taskKey'>;

const task = ({
  modelId = 'model-a',
  outcomes,
  runId,
  taskKey,
}: TaskArgs): TaskTrialsRow => ({
  harnessVersion: 'abcdefabcdef',
  modelId,
  outcomes,
  runId,
  suite: 'skills',
  taskKey,
  taskSet: 'regression',
});

const PASSING = ['pass', 'pass', 'pass'] as const;

const steady = (runId: string) =>
  ['t1', 't2', 't3'].map((taskKey) =>
    task({ outcomes: [...PASSING], runId, taskKey }),
  );

const FLIPPED = [
  ...steady(RUN_A),
  task({ outcomes: [...PASSING], runId: RUN_A, taskKey: 'flaky-one' }),
  ...steady(RUN_B),
  task({
    outcomes: ['fail', 'fail', 'pass'],
    runId: RUN_B,
    taskKey: 'flaky-one',
  }),
];

describe('suiteRegressions', () => {
  it('flags a task that passed every trial and then failed two of three', () => {
    const [regression] = suiteRegressions({
      flaky: [],
      pairs: [PAIR],
      trials: FLIPPED,
    });

    expect(regression?.findings).toEqual([
      { failed: 2, kind: 'flip', taskKey: 'flaky-one', trials: 3 },
    ]);
    expect(regression?.flakyLeftOut).toEqual([]);
  });

  it('leaves a flaky task out of the rule and names it', () => {
    expect(
      suiteRegressions({
        flaky: [{ suite: 'skills', taskKey: 'flaky-one' }],
        pairs: [PAIR],
        trials: FLIPPED,
      }),
    ).toEqual([]);
  });

  it('keeps a flaky task of another suite in the rule', () => {
    expect(
      suiteRegressions({
        flaky: [{ suite: 'verifier-fixtures', taskKey: 'flaky-one' }],
        pairs: [PAIR],
        trials: FLIPPED,
      }),
    ).toHaveLength(1);
  });

  it('flags a pooled pass rate below the run before when only flaky tasks are left out', () => {
    const trials = [
      ...steady(RUN_A),
      task({
        outcomes: ['fail', 'pass', 'fail'],
        runId: RUN_A,
        taskKey: 'flaky-one',
      }),
      ...['t1', 't2', 't3'].map((taskKey) =>
        task({ outcomes: ['fail', 'fail', 'fail'], runId: RUN_B, taskKey }),
      ),
      task({ outcomes: [...PASSING], runId: RUN_B, taskKey: 'flaky-one' }),
    ];
    const [regression] = suiteRegressions({
      flaky: [{ suite: 'skills', taskKey: 'flaky-one' }],
      pairs: [PAIR],
      trials,
    });

    expect(regression?.flakyLeftOut).toEqual(['flaky-one']);
    expect(regression?.findings[0]).toMatchObject({
      kind: 'rate',
      main: { k: 9, n: 9 },
      pr: { k: 0, n: 9 },
    });
  });

  it('judges nothing between runs of two models', () => {
    expect(
      suiteRegressions({
        flaky: [],
        pairs: [PAIR],
        trials: FLIPPED.map((row) =>
          row.runId === RUN_B ? { ...row, modelId: 'model-b' } : row,
        ),
      }),
    ).toEqual([]);
  });

  it('judges nothing for a run with no task stored', () => {
    expect(
      suiteRegressions({
        flaky: [],
        pairs: [PAIR],
        trials: steady(RUN_B),
      }),
    ).toEqual([]);
  });
});
