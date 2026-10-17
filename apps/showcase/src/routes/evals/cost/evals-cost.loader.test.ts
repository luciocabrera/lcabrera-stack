import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectRunCosts } from '../.server/evalsHistory.service';
import { loader } from './evals-cost.loader';

const FIGURES = {
  computedTrials: 0,
  computedUsd: undefined,
  costliestTrialId: '3',
  p50Ms: 1000,
  p95Ms: 2000,
  reportedTrials: 2,
  reportedUsd: 0.5,
  slowestTrialId: '4',
  tokensCacheRead: 0,
  tokensCacheWrite: 0,
  tokensIn: 10,
  tokensOut: 5,
  trials: 2,
};

vi.mock('../.server/evalsHistory.service', () => ({
  selectRunCosts: vi.fn(() =>
    Promise.resolve({
      runs: [
        {
          ...FIGURES,
          modelId: 'model-a',
          runId: '00000000-0000-4000-8000-000000000001',
          startedAt: new Date('2026-10-01T02:00:00Z'),
          suite: 'skills',
        },
      ],
      subjects: [{ ...FIGURES, subjectKind: 'skill', subjectName: 'react-19' }],
      suites: [{ ...FIGURES, suite: 'skills' }],
    }),
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('the cost loader', () => {
  it('charts each suite and labels the two costs in their own cells', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '1');

    const data = await loader();

    expect(selectRunCosts).toHaveBeenCalledWith({ perSuite: 30 });
    expect(data.charts).toHaveLength(1);
    expect(data.charts[0]?.reported).toHaveLength(1);
    expect(data.charts[0]?.computed).toEqual([]);
    expect(data.suites[0]?.cells).toMatchObject({
      computed: 'no model price',
      reported: '$0.50',
    });
    expect(data.subjects[0]?.href).toBe('/evals/subjects/skill/react-19');
  });
});
