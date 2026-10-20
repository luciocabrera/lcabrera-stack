import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectReportRun,
  selectRuleHistory,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { EVALS_REGRESSION } from '../constants/evalsDashboard.constants';
import { runSummary } from '../types/runSummary.fixtures';
import { loader } from './evals-overview.loader';
import { reportRun, reportTask, ruleHistory } from './reportRun.fixtures';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';
const TASK = 'skills/react-19/trigger-1';

vi.mock('../.server/evalsHistory.service', () => ({
  selectReportRun: vi.fn(),
  selectRuleHistory: vi.fn(),
  selectRunSummaries: vi.fn(() =>
    Promise.resolve([
      runSummary({ runId: RUN_B, startedAt: new Date('2026-10-02T02:00:00Z') }),
      runSummary({ runId: RUN_A }),
    ]),
  ),
}));

vi.mocked(selectReportRun).mockImplementation(({ runId }) =>
  Promise.resolve(
    reportRun({
      runId,
      tasks: [
        reportTask({
          outcomes:
            runId === RUN_A
              ? ['pass', 'pass', 'pass']
              : ['pass', 'fail', 'fail'],
          taskKey: TASK,
        }),
      ],
    }),
  ),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the overview loader', () => {
  it("judges each suite's main pair as evals:report does, with both runs kept out of the flaky history", async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectRuleHistory).mockResolvedValue(ruleHistory([]));

    const data = await loader();

    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 30 },
    });
    expect(selectRuleHistory).toHaveBeenCalledWith({
      config: EVALS_REGRESSION,
      excludedRuns: [RUN_A, RUN_B],
      run: expect.objectContaining({ runId: RUN_B }),
    });
    expect(data.regressions.map(({ findings }) => findings)).toMatchObject([
      [{ failed: 2, kind: 'flip', taskKey: TASK, trials: 3 }],
    ]);
    expect(data.suites.map(({ suite }) => suite)).toEqual(['skills']);
  });

  it('flags nothing without a baseline for the model, as evals:report says', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.mocked(selectRuleHistory).mockResolvedValue({
      ...ruleHistory([]),
      baseline: { kind: 'rows' as const, rows: [] },
    });

    const { regressions } = await loader();

    expect(regressions).toEqual([]);
  });

  it('answers 404 with the flag unset', async () => {
    await expect(loader()).rejects.toMatchObject({ status: 404 });
  });
});
