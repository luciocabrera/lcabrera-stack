import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectFlakyTasks,
  selectSubjectRuns,
} from '../.server/evalsHistory.service';
import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { loader } from './evals-heatmap.loader';

vi.mock('../.server/evalsHistory.service', () => ({
  selectFlakyTasks: vi.fn(() =>
    Promise.resolve([
      {
        disagreeFraction: 0.5,
        disagreeing: 5,
        runs: 10,
        suite: 'skills',
        taskKey: 't1',
      },
    ]),
  ),
  selectSubjectRuns: vi.fn(() => Promise.resolve([])),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('the heatmap loader', () => {
  it('reads the recent subject runs and the flaky set at the regression window', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    const data = await loader();

    expect(selectSubjectRuns).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 30 },
    });
    expect(selectFlakyTasks).toHaveBeenCalledWith(EVALS_FLAKY);
    expect(data).toEqual({
      flaky: [{ suite: 'skills', taskKey: 't1' }],
      grids: [],
    });
  });
});
