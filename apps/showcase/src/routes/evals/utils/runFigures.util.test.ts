import type { RunSummary } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { runFigures } from './runFigures.util';

const run: RunSummary = {
  arch: 'x64',
  branch: 'main',
  ciRunner: 'ubuntu-latest',
  concurrency: 1,
  costUsd: 0.5,
  finishedAt: new Date('2026-10-01T02:40:00.000Z'),
  gitDirty: false,
  gitSha: 'a'.repeat(40),
  harnessVersion: 'abcdefabcdef',
  k: 8,
  maxTurns: 20,
  modelId: 'model-a',
  n: 10,
  node: 'v26',
  os: 'linux',
  prNumber: 12,
  runId: '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50',
  runs: 3,
  sdkVersion: '1.0.0',
  startedAt: new Date('2026-10-01T02:00:00.000Z'),
  status: 'complete',
  suite: 'skills',
  timeoutMs: 60_000,
  trials: 12,
  trigger: 'ci-scheduled',
};

describe('runFigures', () => {
  it('adds the pass rate, its interval and the wall-clock duration', () => {
    const figures = runFigures(run);

    expect(figures.rate).toBe(0.8);
    expect(figures.lower).toBeCloseTo(0.49, 2);
    expect(figures.upper).toBeCloseTo(0.943, 2);
    expect(figures.durationMs).toBe(40 * 60 * 1000);
    expect(figures.startedAt).toBe('2026-10-01T02:00:00.000Z');
  });

  it('draws no interval below the minimum number of scored trials', () => {
    const figures = runFigures({ ...run, k: 2, n: 3 });

    expect(figures.rate).toBe(2 / 3);
    expect(figures.lower).toBeUndefined();
    expect(figures.upper).toBeUndefined();
  });

  it('has no rate when nothing was scored', () => {
    expect(runFigures({ ...run, k: 0, n: 0 }).rate).toBeUndefined();
  });
});
