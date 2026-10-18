import { regressionVerdict } from '@repo/eval-history/report/regressionVerdict.util';
import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { EVALS_REGRESSION } from '../constants/evalsDashboard.constants';
import { reportRun, reportTask, ruleHistory } from './reportRun.fixtures';
import { suiteRegressions } from './suiteRegressions.util';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

const PASSING = ['pass', 'pass', 'pass'] as const;

const PAIR = {
  latest: { runId: RUN_B } as RunFigures,
  previous: { runId: RUN_A } as RunFigures,
  suite: 'skills',
};

const OLDER = reportRun({
  runId: RUN_A,
  tasks: [
    reportTask({
      outcomes: [...PASSING],
      taskKey: 'skills/react-19/trigger-1',
    }),
    reportTask({
      outcomes: [...PASSING],
      taskKey: 'skills/react-19/trigger-2',
    }),
  ],
});

const REGRESSED = reportRun({
  runId: RUN_B,
  tasks: [
    reportTask({
      outcomes: [...PASSING],
      taskKey: 'skills/react-19/trigger-1',
    }),
    reportTask({
      outcomes: ['pass', 'fail', 'fail'],
      taskKey: 'skills/react-19/trigger-2',
    }),
  ],
});

type JudgeArgs = {
  readonly a: ReturnType<typeof reportRun>;
  readonly b: ReturnType<typeof reportRun>;
  readonly history: ReturnType<typeof ruleHistory>;
};

const judge = ({ a, b, history }: JudgeArgs) =>
  suiteRegressions([
    {
      ...PAIR,
      verdict: regressionVerdict({
        a,
        allowHarnessChange: false,
        b,
        config: EVALS_REGRESSION,
        history,
      }),
    },
  ]);

describe('suiteRegressions', () => {
  it('flags a 3/3 to 1/3 drop in the newer run of a task with two runs of history', () => {
    const [regression] = judge({
      a: OLDER,
      b: REGRESSED,
      history: ruleHistory([]),
    });

    expect(regression?.findings).toMatchObject([
      {
        failed: 2,
        kind: 'flip',
        taskKey: 'skills/react-19/trigger-2',
        trials: 3,
      },
    ]);
    expect(regression?.flakyLeftOut).toEqual([]);
  });

  it('leaves out a task the history marks flaky, and names it', () => {
    const flaky = {
      disagreeFraction: 0.5,
      disagreeing: 5,
      runs: 10,
      suite: 'skills',
      taskKey: 'skills/react-19/trigger-2',
    } as const;

    expect(
      judge({ a: OLDER, b: REGRESSED, history: ruleHistory([flaky]) }),
    ).toEqual([]);
  });

  it('does not flag a suite for a new task the older run never held', () => {
    const withNewSkill = reportRun({
      runId: RUN_B,
      tasks: [
        ...OLDER.tasks,
        reportTask({
          outcomes: ['fail', 'fail', 'fail'],
          taskKey: 'skills/brand-new/trigger-1',
        }),
        reportTask({
          outcomes: ['fail', 'fail', 'fail'],
          taskKey: 'skills/brand-new/trigger-2',
        }),
      ],
    });

    expect(
      judge({ a: OLDER, b: withNewSkill, history: ruleHistory([]) }),
    ).toEqual([]);
  });

  it('judges nothing between runs of two models', () => {
    expect(
      judge({
        a: OLDER,
        b: { ...REGRESSED, modelId: 'model-b' },
        history: ruleHistory([]),
      }),
    ).toEqual([]);
  });
});
