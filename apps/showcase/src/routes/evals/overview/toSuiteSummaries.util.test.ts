import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { toSuiteSummaries } from './toSuiteSummaries.util';

const run = (overrides: Partial<RunFigures>): RunFigures => ({
  arch: undefined,
  branch: 'main',
  ciRunner: undefined,
  concurrency: undefined,
  costUsd: undefined,
  durationMs: 1000,
  finishedAt: '2026-10-01T02:40:00.000Z',
  gitDirty: false,
  gitSha: 'a'.repeat(40),
  harnessVersion: 'abcdefabcdef',
  k: 1,
  lower: undefined,
  maxTurns: undefined,
  modelId: undefined,
  n: 2,
  node: undefined,
  os: undefined,
  prNumber: undefined,
  rate: 0.5,
  runId: 'run',
  runs: undefined,
  sdkVersion: undefined,
  startedAt: '2026-10-01T02:00:00.000Z',
  status: 'complete',
  suite: 'skills',
  timeoutMs: undefined,
  trials: 2,
  trigger: 'ci-scheduled',
  upper: undefined,
  ...overrides,
});

describe('toSuiteSummaries', () => {
  it('takes the newest run of each suite as its latest', () => {
    const summaries = toSuiteSummaries([
      run({ runId: 'skills-new', suite: 'skills' }),
      run({ runId: 'skills-old', suite: 'skills' }),
      run({ runId: 'rules-new', suite: 'rules-consistency' }),
    ]);

    expect(summaries.map(({ latest, suite }) => [suite, latest.runId])).toEqual(
      [
        ['skills', 'skills-new'],
        ['rules-consistency', 'rules-new'],
      ],
    );
  });

  it('plots the scored runs oldest first, each linked to its run', () => {
    const [summary] = toSuiteSummaries([
      run({ rate: 0.9, runId: 'c', startedAt: '2026-10-03T02:00:00.000Z' }),
      run({ rate: undefined, runId: 'b' }),
      run({ rate: 0.6, runId: 'a', startedAt: '2026-10-01T02:00:00.000Z' }),
    ]);

    expect(summary?.points).toEqual([
      {
        href: '/evals/runs/a',
        key: 'a',
        label: 'Run a, 2026-10-01 on main: 60% (1/2)',
        value: 0.6,
      },
      {
        href: '/evals/runs/c',
        key: 'c',
        label: 'Run c, 2026-10-03 on main: 90% (1/2)',
        value: 0.9,
      },
    ]);
  });
});
