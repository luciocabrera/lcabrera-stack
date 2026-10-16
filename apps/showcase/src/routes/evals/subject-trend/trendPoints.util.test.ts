import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { trendPoints } from './trendPoints.util';

const run = (overrides: Partial<SubjectRun>): SubjectRun => ({
  contentHash: 'c'.repeat(64),
  k: 9,
  modelId: 'model-a',
  n: 10,
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-10-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskKeys: ['skills/react-19/trigger-1'],
  trialId: '12',
  trials: 10,
  ...overrides,
});

describe('trendPoints', () => {
  it('plots the scored runs oldest first', () => {
    const points = trendPoints([
      run({ runId: '00000000-0000-4000-8000-00000000000c' }),
      run({ k: 0, n: 0, runId: '00000000-0000-4000-8000-00000000000b' }),
      run({ runId: '00000000-0000-4000-8000-00000000000a' }),
    ]);

    expect(points.map(({ key }) => key.slice(-1))).toEqual(['a', 'c']);
  });

  it('links each point through to its run and the trial it names', () => {
    const [point] = trendPoints([run({ trialId: '77' })]);

    expect(point?.href).toBe(
      '/evals/runs/00000000-0000-4000-8000-000000000001?trial=77',
    );
    expect(point?.label).toContain('open trial 77');
  });

  it('carries the rate with its Wilson band', () => {
    const [point] = trendPoints([run({})]);

    expect(point?.value).toBe(0.9);
    expect(point?.lower).toBeLessThan(0.9);
    expect(point?.upper).toBeGreaterThan(0.9);
  });
});
