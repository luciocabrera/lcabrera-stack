import { describe, expect, it } from 'vite-plus/test';

import type { RunCost } from './EvalsCost.types';

import { costChartPoints } from './costChartPoints.util';

const run = (overrides: Partial<RunCost>): RunCost => ({
  computedTrials: 3,
  computedUsd: 0.3,
  costliestTrialId: '11',
  modelId: 'model-a',
  p50Ms: 1000,
  p95Ms: 2000,
  reportedTrials: 3,
  reportedUsd: 0.25,
  runId: '00000000-0000-4000-8000-000000000001',
  slowestTrialId: '12',
  startedAt: new Date('2026-10-02T02:00:00Z'),
  suite: 'skills',
  tokensCacheRead: 0,
  tokensCacheWrite: 0,
  tokensIn: 100,
  tokensOut: 10,
  trials: 3,
  ...overrides,
});

describe('costChartPoints', () => {
  it('links a cost point to its run and its costliest trial, oldest first', () => {
    const points = costChartPoints({
      metric: 'reported',
      runs: [
        run({}),
        run({
          costliestTrialId: '5',
          runId: '00000000-0000-4000-8000-000000000002',
          startedAt: new Date('2026-10-01T02:00:00Z'),
        }),
      ],
    });

    expect(points.map(({ href }) => href)).toEqual([
      '/evals/runs/00000000-0000-4000-8000-000000000002?trial=5',
      '/evals/runs/00000000-0000-4000-8000-000000000001?trial=11',
    ]);
    expect(points[1]?.label).toBe(
      'Run 00000000, 2026-10-02: $0.25 reported by the SDK; open the costliest trial, 11',
    );
  });

  it('links a latency point to its slowest trial', () => {
    const [point] = costChartPoints({ metric: 'p95', runs: [run({})] });

    expect(point).toMatchObject({
      href: '/evals/runs/00000000-0000-4000-8000-000000000001?trial=12',
      value: 2000,
    });
  });

  it('labels the computed cost apart from the reported one and skips an unpriced run', () => {
    const points = costChartPoints({
      metric: 'computed',
      runs: [
        run({}),
        run({
          computedUsd: undefined,
          runId: '00000000-0000-4000-8000-000000000003',
        }),
      ],
    });

    expect(points).toHaveLength(1);
    expect(points[0]?.label).toContain('$0.30 computed from model prices');
  });
});
