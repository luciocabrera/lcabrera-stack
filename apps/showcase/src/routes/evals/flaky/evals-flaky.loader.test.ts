import { regressionVerdict } from '@repo/eval-history/report/regressionVerdict.util';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import {
  selectFlakyTasks,
  selectRunSummaries,
  selectTaskTrials,
} from '../.server/evalsHistory.service';
import { selectJudgedMainPairs } from '../.server/selectJudgedMainPairs.service';
import {
  EVALS_FLAKY,
  EVALS_REGRESSION,
} from '../constants/evalsDashboard.constants';
import {
  reportRun,
  reportTask,
  ruleHistory,
} from '../overview/reportRun.fixtures';
import { runSummary } from '../types/runSummary.fixtures';
import { loader } from './evals-flaky.loader';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

vi.mock('../.server/evalsHistory.service', () => ({
  selectFlakyTasks: vi.fn(() =>
    Promise.resolve([
      {
        disagreeFraction: 0.5,
        disagreeing: 1,
        runs: 2,
        suite: 'skills',
        taskKey: 'unexcluded',
      },
    ]),
  ),
  selectRunSummaries: vi.fn(() =>
    Promise.resolve([
      runSummary({ runId: RUN_B }),
      runSummary({ runId: RUN_A }),
    ]),
  ),
  selectTaskTrials: vi.fn(() =>
    Promise.resolve([
      {
        outcomes: ['pass', 'fail', 'pass'],
        runId: RUN_B,
        suite: 'skills',
        taskKey: 'left-out',
        taskSet: 'regression',
      },
    ]),
  ),
}));

vi.mock('../.server/selectJudgedMainPairs.service', () => ({
  selectJudgedMainPairs: vi.fn(),
}));

const LEFT_OUT = {
  disagreeFraction: 0.5,
  disagreeing: 3,
  runs: 6,
  suite: 'skills',
  taskKey: 'left-out',
} as const;

const tasks = [
  reportTask({ outcomes: ['pass', 'pass', 'pass'], taskKey: 'left-out' }),
];

const JUDGED = {
  latest: {
    branch: 'main',
    runId: RUN_B,
    startedAt: '2026-10-02T02:00:00.000Z',
  },
  previous: {
    branch: 'main',
    runId: RUN_A,
    startedAt: '2026-10-01T02:00:00.000Z',
  },
  suite: 'skills',
  verdict: regressionVerdict({
    a: reportRun({ runId: RUN_A, tasks }),
    allowHarnessChange: false,
    b: reportRun({ runId: RUN_B, tasks }),
    config: EVALS_REGRESSION,
    history: ruleHistory([LEFT_OUT]),
  }),
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('the flaky loader', () => {
  it("lists what the rule leaves out of a suite's judged pair, with its split per run", async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectJudgedMainPairs).mockResolvedValue({
      figures: [],
      judged: [
        {
          ...JUDGED,
          latest: JUDGED.latest as RunFigures,
          previous: JUDGED.previous as RunFigures,
        },
      ],
    });

    const { suites } = await loader();

    expect(selectFlakyTasks).toHaveBeenCalledWith(EVALS_FLAKY);
    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: EVALS_FLAKY.window },
    });
    expect(selectTaskTrials).toHaveBeenCalledWith({
      runIds: [RUN_B, RUN_A],
      taskKeys: ['left-out'],
    });
    expect(suites[0]?.basis.kind).toBe('pair');
    expect(suites[0]?.tasks.map(({ taskKey }) => taskKey)).toEqual([
      'left-out',
    ]);
    expect(suites[0]?.tasks[0]?.cells.at(-1)).toMatchObject({
      isSplit: true,
      label: '2/3',
    });
  });

  it('counts every run for a suite with no pair to judge', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectJudgedMainPairs).mockResolvedValue({
      figures: [],
      judged: [],
    });

    const { suites } = await loader();

    expect(suites[0]).toMatchObject({
      basis: { kind: 'all-runs' },
      tasks: [{ disagreeing: 1, runs: 2, taskKey: 'unexcluded' }],
    });
  });
});
