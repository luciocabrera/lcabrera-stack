import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectFlakyTasks,
  selectRunSummaries,
  selectTaskTrials,
} from '../.server/evalsHistory.service';
import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { runSummary } from '../types/runSummary.fixtures';
import { loader } from './evals-flaky.loader';

const RUN_A = '00000000-0000-4000-8000-00000000000a';

vi.mock('../.server/evalsHistory.service', () => ({
  selectFlakyTasks: vi.fn(),
  selectRunSummaries: vi.fn(() =>
    Promise.resolve([runSummary({ runId: RUN_A })]),
  ),
  selectTaskTrials: vi.fn(() =>
    Promise.resolve([
      {
        outcomes: ['pass', 'fail', 'pass'],
        runId: RUN_A,
        suite: 'skills',
        taskKey: 't1',
        taskSet: 'regression',
      },
    ]),
  ),
}));

const FLAKY = {
  disagreeFraction: 0.5,
  disagreeing: 5,
  runs: 10,
  suite: 'skills',
  taskKey: 't1',
} as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('the flaky loader', () => {
  it("reads each flaky task's trials over its suite's last runs at the regression window", async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectFlakyTasks).mockResolvedValue([FLAKY, FLAKY]);

    const { suites } = await loader();

    expect(selectFlakyTasks).toHaveBeenCalledWith(EVALS_FLAKY);
    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: EVALS_FLAKY.window },
    });
    expect(selectTaskTrials).toHaveBeenCalledWith({
      runIds: [RUN_A],
      taskKeys: ['t1'],
    });
    expect(suites[0]?.tasks[0]?.cells).toEqual([
      {
        href: `/evals/runs/${RUN_A}`,
        isSplit: true,
        label: '2/3',
        runId: RUN_A,
      },
    ]);
  });

  it('reads no trials when no task is flaky', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectFlakyTasks).mockResolvedValue([]);

    const { suites } = await loader();

    expect(selectTaskTrials).not.toHaveBeenCalled();
    expect(suites).toEqual([
      {
        runs: [
          { href: `/evals/runs/${RUN_A}`, label: '2026-10-01', runId: RUN_A },
        ],
        suite: 'skills',
        tasks: [],
      },
    ]);
  });
});
