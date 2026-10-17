import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { trendSeries } from './trendSeries.util';

const run = (overrides: Partial<SubjectRun>): SubjectRun => ({
  contentHashes: ['a'.repeat(64)],
  k: 3,
  modelId: 'model-a',
  n: 3,
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-10-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskKeys: ['t1'],
  trialId: '1',
  trials: 3,
  ...overrides,
});

const SKILLS_OLD = run({});

const QUALITY = run({
  contentHashes: ['b'.repeat(64)],
  modelId: 'model-b',
  runId: '00000000-0000-4000-8000-000000000002',
  startedAt: new Date('2026-10-02T02:00:00Z'),
  suite: 'skill-quality',
});

const SKILLS_NEW = run({
  runId: '00000000-0000-4000-8000-000000000003',
  startedAt: new Date('2026-10-03T02:00:00Z'),
});

describe('trendSeries', () => {
  it('keeps each suite that records the subject in its own series', () => {
    const series = trendSeries({
      annotations: [],
      runs: [SKILLS_NEW, QUALITY, SKILLS_OLD],
    });

    expect(
      series.map(({ points, suite }) => [suite, points.map(({ key }) => key)]),
    ).toEqual([
      ['skill-quality', [QUALITY.runId]],
      ['skills', [SKILLS_OLD.runId, SKILLS_NEW.runId]],
    ]);
  });

  it('marks no change between runs of two different suites', () => {
    const series = trendSeries({
      annotations: [],
      runs: [SKILLS_NEW, QUALITY, SKILLS_OLD],
    });

    expect(series.flatMap(({ marks }) => marks)).toEqual([]);
  });

  it('places an annotation in every series it falls inside', () => {
    const series = trendSeries({
      annotations: [
        { annotationId: '1', at: '2026-10-01T12:00:00.000Z', kind: 'note' },
      ],
      runs: [SKILLS_NEW, QUALITY, SKILLS_OLD],
    });

    expect(series.map(({ marks }) => marks.map(({ index }) => index))).toEqual([
      [0],
      [1],
    ]);
  });
});
