import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectFlakyTasks,
  selectRunSummaries,
  selectTaskTrials,
} from '../.server/evalsHistory.service';
import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { runSummary } from '../types/runSummary.fixtures';
import { loader } from './evals-overview.loader';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

vi.mock('../.server/evalsHistory.service', () => ({
  selectFlakyTasks: vi.fn(() =>
    Promise.resolve([
      {
        disagreeFraction: 0.5,
        disagreeing: 5,
        runs: 10,
        suite: 'skills',
        taskKey: 'skills/react-19/trigger-1',
      },
    ]),
  ),
  selectRunSummaries: vi.fn(() =>
    Promise.resolve([
      runSummary({ runId: RUN_B, startedAt: new Date('2026-10-02T02:00:00Z') }),
      runSummary({ runId: RUN_A }),
    ]),
  ),
  selectTaskTrials: vi.fn(() =>
    Promise.resolve([
      {
        harnessVersion: 'abcdefabcdef',
        modelId: 'model-a',
        outcomes: ['pass', 'pass', 'pass'],
        runId: RUN_A,
        suite: 'skills',
        taskKey: 'skills/react-19/trigger-1',
        taskSet: 'regression',
      },
      {
        harnessVersion: 'abcdefabcdef',
        modelId: 'model-a',
        outcomes: ['fail', 'fail', 'fail'],
        runId: RUN_B,
        suite: 'skills',
        taskKey: 'skills/react-19/trigger-1',
        taskSet: 'regression',
      },
    ]),
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('the overview loader', () => {
  it("reads both runs of each suite's main pair and judges them without the flaky set", async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    const data = await loader();

    expect(selectFlakyTasks).toHaveBeenCalledWith(EVALS_FLAKY);
    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 30 },
    });
    expect(selectTaskTrials).toHaveBeenCalledWith({ runIds: [RUN_B, RUN_A] });
    expect(data.regressions).toEqual([]);
    expect(data.suites.map(({ suite }) => suite)).toEqual(['skills']);
  });

  it('flags the same flip once the task is no longer flaky', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectFlakyTasks).mockResolvedValueOnce([]);

    const { regressions } = await loader();

    expect(regressions.map(({ findings }) => findings)).toEqual([
      [
        {
          failed: 3,
          kind: 'flip',
          taskKey: 'skills/react-19/trigger-1',
          trials: 3,
        },
      ],
    ]);
  });

  it('answers 404 with the flag unset', async () => {
    await expect(loader()).rejects.toMatchObject({ status: 404 });
  });
});
