import { regressionVerdict } from '@repo/eval-history/report/regressionVerdict.util';
import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { EVALS_REGRESSION } from '../constants/evalsDashboard.constants';
import {
  reportRun,
  reportTask,
  ruleHistory,
} from '../overview/reportRun.fixtures';
import { suiteLeftOut } from './suiteLeftOut.util';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

const run = (runId: string) =>
  ({
    branch: 'main',
    runId,
    startedAt: '2026-10-01T02:00:00.000Z',
  }) as RunFigures;

const FLAKY = {
  disagreeFraction: 0.5,
  disagreeing: 2,
  runs: 4,
  suite: 'skills',
  taskKey: 'skills/react-19/trigger-1',
} as const;

const tasks = [
  reportTask({ outcomes: ['pass', 'pass', 'pass'], taskKey: FLAKY.taskKey }),
];

const PAIR = {
  latest: run(RUN_B),
  previous: run(RUN_A),
  suite: 'skills',
  verdict: regressionVerdict({
    a: reportRun({ runId: RUN_A, tasks }),
    allowHarnessChange: false,
    b: reportRun({ runId: RUN_B, tasks }),
    config: EVALS_REGRESSION,
    history: ruleHistory([FLAKY]),
  }),
};

describe('suiteLeftOut', () => {
  it("takes a judged suite's list from its verdict, not from the unexcluded count", () => {
    expect(
      suiteLeftOut({
        judged: [PAIR],
        suite: 'skills',
        unexcluded: [{ ...FLAKY, taskKey: 'only-flaky-counting-the-pair' }],
      }),
    ).toEqual({
      basis: {
        kind: 'pair',
        latest: {
          href: `/evals/runs/${RUN_B}`,
          label: '2026-10-01 02:00 on main',
        },
        previous: {
          href: `/evals/runs/${RUN_A}`,
          label: '2026-10-01 02:00 on main',
        },
      },
      tasks: [{ disagreeing: 2, runs: 4, taskKey: FLAKY.taskKey }],
    });
  });

  it('counts every run for a suite with no judged pair', () => {
    expect(
      suiteLeftOut({
        judged: [PAIR],
        suite: 'verifier-fixtures',
        unexcluded: [{ ...FLAKY, suite: 'verifier-fixtures' }],
      }),
    ).toEqual({
      basis: { kind: 'all-runs' },
      tasks: [{ disagreeing: 2, runs: 4, taskKey: FLAKY.taskKey }],
    });
  });
});
