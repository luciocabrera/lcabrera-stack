import { describe, expect, it } from 'vite-plus/test';

import { accuracyChartSeries } from './accuracyChartSeries.util';

describe('accuracyChartSeries', () => {
  it('draws one series per model, each point at its case opening', () => {
    expect(
      accuracyChartSeries([
        {
          model: 'model-a',
          points: [
            {
              at: '2026-11-01T10:00:00.000Z',
              label: 'model-a after FP-0001: 100% (1/1)',
              value: 1,
            },
          ],
        },
      ]),
    ).toEqual([
      {
        id: 'model-a',
        label: 'model-a',
        points: [
          {
            label: 'model-a after FP-0001: 100% (1/1)',
            x: new Date('2026-11-01T10:00:00.000Z'),
            y: 1,
          },
        ],
      },
    ]);
  });
});
