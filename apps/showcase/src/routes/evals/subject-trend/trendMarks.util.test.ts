import { describe, expect, it } from 'vite-plus/test';

import { trendMarks } from './trendMarks.util';

type PointArgs = {
  readonly contentHash?: string;
  readonly key: string;
  readonly modelId?: string;
  readonly startedAt: string;
};

const point = ({ key, startedAt, ...overrides }: PointArgs) => ({
  contentHash: 'a'.repeat(64),
  href: `/evals/runs/${key}`,
  key,
  label: key,
  lower: undefined,
  modelId: 'model-a',
  startedAt,
  upper: undefined,
  value: 1,
  ...overrides,
});

describe('trendMarks', () => {
  it('marks the run where the content hash or the model changed', () => {
    const marks = trendMarks({
      annotations: [],
      points: [
        point({ key: 'r1', startedAt: '2026-01-01' }),
        point({
          contentHash: 'b'.repeat(64),
          key: 'r2',
          startedAt: '2026-01-02',
        }),
        point({
          contentHash: 'b'.repeat(64),
          key: 'r3',
          modelId: 'model-b',
          startedAt: '2026-01-03',
        }),
      ],
    });

    expect(marks.map(({ index, kind, label }) => [index, kind, label])).toEqual(
      [
        [1, 'content', 'Content hash changed to bbbbbbbbbbbb'],
        [2, 'model', 'Model changed from model-a to model-b'],
      ],
    );
  });

  it('marks an annotation on the first run at or after it', () => {
    const marks = trendMarks({
      annotations: [
        { annotationId: '4', at: '2026-01-01T12:00:00.000Z', kind: 'incident' },
        { annotationId: '5', at: '2026-02-01T00:00:00.000Z', kind: 'note' },
      ],
      points: [
        point({ key: 'r1', startedAt: '2026-01-01T02:00:00.000Z' }),
        point({ key: 'r2', startedAt: '2026-01-02T02:00:00.000Z' }),
      ],
    });

    expect(marks).toEqual([
      {
        index: 1,
        key: 'annotation-4',
        kind: 'annotation',
        label: 'incident annotation, 2026-01-01',
      },
    ]);
  });
});
