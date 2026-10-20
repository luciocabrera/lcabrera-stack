import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectRunHealth,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { runSummary } from '../types/runSummary.fixtures';
import { loader } from './evals-health.loader';

const RUN_A = '00000000-0000-4000-8000-00000000000a';

vi.mock('../.server/evalsHistory.service', () => ({
  selectRunHealth: vi.fn(() =>
    Promise.resolve([
      { errorClass: 'rate_limit', outcome: 'error', runId: RUN_A, trials: 2 },
    ]),
  ),
  selectRunSummaries: vi.fn(() =>
    Promise.resolve([runSummary({ runId: RUN_A })]),
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the run health loader', () => {
  it('counts the error classes of the recent runs of each suite', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    const { suites } = await loader();

    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 30 },
    });
    expect(selectRunHealth).toHaveBeenCalledWith({ runIds: [RUN_A] });
    expect(suites[0]?.totals).toEqual({
      errors: 2,
      rateLimits: 2,
      timeouts: 0,
      trials: 3,
    });
  });
});
