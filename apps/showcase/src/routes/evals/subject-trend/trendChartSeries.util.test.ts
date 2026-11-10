import { describe, expect, it } from 'vite-plus/test';

import { trendChartSeries } from './trendChartSeries.util';

const point = (overrides: object) => ({
  contentHashes: ['c'],
  href: '/evals/runs/r1?trial=1',
  key: 'r1',
  label: 'skills run r1',
  lower: 0.4,
  modelId: 'model-a',
  startedAt: '2026-10-01T02:00:00.000Z',
  upper: 0.9,
  value: 0.7,
  ...overrides,
});

const mark = (kind: 'annotation' | 'content' | 'model') => ({
  href: '/evals/runs/r1?trial=1',
  key: `${kind}-r1`,
  kind,
  label: kind,
  pointLabel: 'skills run r1',
  startedAt: '2026-10-01T02:00:00.000Z',
});

describe('trendChartSeries', () => {
  it('draws the pass rate with its Wilson band, each point linked to its run', () => {
    const { line } = trendChartSeries({
      marks: [],
      points: [
        point({}),
        point({
          href: '/evals/runs/r2?trial=2',
          label: 'skills run r2',
          lower: undefined,
          startedAt: '2026-10-02T02:00:00.000Z',
          upper: undefined,
          value: 0,
        }),
        point({
          href: '/evals/runs/r3?trial=3',
          label: 'skills run r3',
          lower: 0.1,
          startedAt: '2026-10-03T02:00:00.000Z',
          upper: undefined,
          value: 0.2,
        }),
      ],
      runs: 3,
      suite: 'skills',
    });

    expect(line).toEqual({
      band: [
        { lower: 0.4, upper: 0.9, x: new Date('2026-10-01T02:00:00.000Z') },
      ],
      id: 'skills',
      label: 'Pass rate',
      points: [
        {
          label: 'skills run r1',
          to: '/evals/runs/r1?trial=1',
          x: new Date('2026-10-01T02:00:00.000Z'),
          y: 0.7,
        },
        {
          label: 'skills run r2',
          to: '/evals/runs/r2?trial=2',
          x: new Date('2026-10-02T02:00:00.000Z'),
          y: 0,
        },
        {
          label: 'skills run r3',
          to: '/evals/runs/r3?trial=3',
          x: new Date('2026-10-03T02:00:00.000Z'),
          y: 0.2,
        },
      ],
    });
  });

  it('tones each mark by its kind at the run it lands on', () => {
    const { markers } = trendChartSeries({
      marks: [mark('content'), mark('model'), mark('annotation')],
      points: [point({})],
      runs: 1,
      suite: 'skills',
    });
    const x = new Date('2026-10-01T02:00:00.000Z');

    expect(markers).toEqual([
      { label: 'content', tone: 'info', x },
      { label: 'model', tone: 'secondary', x },
      { label: 'annotation', tone: 'warning', x },
    ]);
  });
});
