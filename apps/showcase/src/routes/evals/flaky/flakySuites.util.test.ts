import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { flakySuites } from './flakySuites.util';

type RunArgs = {
  readonly runId: string;
  readonly suite?: string;
};

const run = ({ runId, suite = 'skills' }: RunArgs) =>
  ({
    runId,
    startedAt: `2026-10-0${runId}T02:00:00.000Z`,
    suite,
  }) as RunFigures;

const FLAKY = {
  disagreeFraction: 0.3,
  disagreeing: 3,
  runs: 10,
  suite: 'skills',
  taskKey: 't1',
} as const;

describe('flakySuites', () => {
  it("lays each flaky task's trial split across its suite's runs, oldest first", () => {
    const [suite] = flakySuites({
      judged: [],
      runs: [run({ runId: '2' }), run({ runId: '1' })],
      trials: [
        {
          outcomes: ['pass', 'error', 'fail'],
          runId: '2',
          suite: 'skills',
          taskKey: 't1',
          taskSet: 'regression',
        },
        {
          outcomes: ['pass', 'pass', 'pass'],
          runId: '1',
          suite: 'skills',
          taskKey: 't1',
          taskSet: 'regression',
        },
      ],
      unexcluded: [FLAKY],
    });

    expect(suite?.runs.map(({ runId }) => runId)).toEqual(['1', '2']);
    expect(suite?.tasks).toEqual([
      {
        cells: [
          { href: '/evals/runs/1', isSplit: false, label: '3/3', runId: '1' },
          {
            href: '/evals/runs/2',
            isSplit: true,
            label: '1/2, 1 not scored',
            runId: '2',
          },
        ],
        disagreeing: 3,
        runs: 10,
        taskKey: 't1',
      },
    ]);
  });

  it('says a task did not run, and keeps a suite with no flaky task', () => {
    const suites = flakySuites({
      judged: [],
      runs: [
        run({ runId: '1' }),
        run({ runId: '3', suite: 'verifier-fixtures' }),
      ],
      trials: [],
      unexcluded: [FLAKY],
    });

    expect(suites[0]?.tasks[0]?.cells[0]).toMatchObject({ label: 'not run' });
    expect(suites[1]).toMatchObject({ suite: 'verifier-fixtures', tasks: [] });
  });
});
